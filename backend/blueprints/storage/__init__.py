import io, os, hashlib

from datetime import timedelta

from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename

from models.database import db, Document, DocumentFile
from storage.minio_client import upload_file, presigned_get, MINIO_BUCKET

bp = Blueprint('files', __name__, url_prefix='/api')

# General settings
MAX_UPLOAD_BYTES = int(os.getenv('MAX_UPLOAD_BYTES', 10 * 1024 * 1024))  # default 10 MB
ALLOWED_EXTENSIONS = None  # allow all default

def allowed_file(filename: str) -> bool:
    """Check if the file has an allowed extension."""
    if not ALLOWED_EXTENSIONS:
        return True
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/documents/<int:doc_id>/files', methods=['POST'])
def upload_document_file(doc_id: int):
    """Upload a file for the given document."""
    # Ensure doc exists
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'document not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'file required'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'no file selected'}), 400
    if not allowed_file(f.filename):
        return jsonify({'error': 'file type not allowed'}), 400

    # read bytes (safe because size is small)
    data = f.read()
    size = len(data)
    if size > MAX_UPLOAD_BYTES:
        return jsonify({'error': 'file too large'}), 400

    filename = secure_filename(f.filename)
    content_type = f.mimetype

    # calculate sha256
    sha256 = hashlib.sha256(data).hexdigest()

    # storage key: document/<doc_id>/v{n}/{filename}
    # determine next version
    last = DocumentFile.query.filter_by(document_id=doc_id).order_by(DocumentFile.version.desc()).first()
    next_version = (last.version + 1) if last else 1
    object_key = f"document/{doc_id}/v{next_version}/{filename}"

    # upload to MinIO
    upload_file(MINIO_BUCKET, object_key, io.BytesIO(data), size, content_type=content_type)

    # store metadata
    df = DocumentFile(
        document_id=doc_id,
        storage_key=object_key,
        filename=filename,
        content_type=content_type,
        size=size,
        sha256=sha256,
        version=next_version,
    )
    db.session.add(df)
    db.session.commit()
    db.session.refresh(df)

    return jsonify(df.to_dict()), 201

@bp.route('/documents/<int:doc_id>/files/<int:file_id>', methods=['GET'])
def download_document_file(doc_id: int, file_id: int):
    """Download a single file for the given document."""
    df = DocumentFile.query.get(file_id)
    if not df or df.document_id != doc_id:
        return jsonify({'error': 'not found'}), 404

    # If configured to return presigned URLs, return it.
    if os.getenv('USE_PRESIGNED_URLS', '1') in ('1', 'true', 'True'):
        url = presigned_get(MINIO_BUCKET, df.storage_key, expires=timedelta(minutes=15))
        return jsonify({'url': url})

    # Otherwise proxy the object through the app (not optimal for large files)
    from storage.minio_client import client
    try:
        obj = client.get_object(MINIO_BUCKET, df.storage_key)
        data = obj.read()
    except Exception:
        return jsonify({'error': 'failed to read object'}), 500

    return send_file(
        io.BytesIO(data),
        mimetype=df.content_type or 'application/octet-stream',
        as_attachment=True,
        download_name=df.filename,
    )

@bp.route('/documents/<int:doc_id>/files', methods=['GET'])
def list_document_files(doc_id: int):
    """Return a list of files (metadata) for the given document."""
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'document not found'}), 404

    files = DocumentFile.query.filter_by(document_id=doc_id).order_by(DocumentFile.version.desc()).all()
    return jsonify([f.to_dict() for f in files])

@bp.route('/documents/<int:doc_id>/files/<int:file_id>', methods=['DELETE'])
def delete_document_file(doc_id: int, file_id: int):
    """Delete a single file (metadata + object) for a document."""
    df = DocumentFile.query.get(file_id)
    if not df or df.document_id != doc_id:
        return jsonify({'error': 'not found'}), 404

    # try to remove object from MinIO
    from storage.minio_client import client
    try:
        client.remove_object(MINIO_BUCKET, df.storage_key)
    except Exception:
        # ignore removal errors but continue to delete metadata
        pass

    try:
        db.session.delete(df)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'failed to delete metadata'}), 500

    return '', 204

