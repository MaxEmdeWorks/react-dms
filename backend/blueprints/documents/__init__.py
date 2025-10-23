import os, json

from flask import Blueprint, jsonify, request
from models.database import db, Document, DocumentFile

bp = Blueprint('documents', __name__, url_prefix='/api')

@bp.route('/documents', methods=['GET'])
def list_documents():
    # Get request
    status = request.args.get('status', 'all')
    search_filter = (request.args.get('filter') or '').strip().lower()

    # Build query
    query = Document.query
    if status in ('active', 'archived'):
        query = query.filter(Document.status == status)
    if search_filter:
        like = f"%{search_filter}%"
        query = query.filter((Document.title.ilike(like)) | (Document.tags.ilike(like)))
    docs = query.order_by(Document.created_at.desc()).all()

    # Return result
    return jsonify([d.to_dict() for d in docs])

@bp.route('/documents', methods=['POST'])
def create_document():
    # Parse request
    payload = request.get_json(force=True) or {}
    title = (payload.get('title') or '').strip()
    tags = (payload.get('tags') or '').strip()

    # Validate
    if not title:
        return jsonify({'error': 'title required'}), 400

    # Create document
    doc = Document(title=title, tags=tags, status='active')
    db.session.add(doc)
    db.session.commit()
    db.session.refresh(doc)

    # Return result
    return jsonify(doc.to_dict()), 201

@bp.route('/documents/<int:doc_id>', methods=['PATCH'])
def update_document(doc_id: int):
    # Parse request
    payload = request.get_json(force=True) or {}

    # Get document
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'not found'}), 404

    # Update fields
    status = payload.get('status')
    title = payload.get('title')
    tags = payload.get('tags')
    if status in ('active', 'archived'):
        doc.status = status
    if isinstance(title, str) and title.strip():
        doc.title = title.strip()
    if isinstance(tags, str):
        doc.tags = tags.strip()

    # Save changes
    db.session.commit()
    db.session.refresh(doc)

    # Return result
    return jsonify(doc.to_dict())

@bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id: int):
    # Get document
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({'error': 'not found'}), 404

    # Remove associated files from storage
    try:
        from storage.minio_client import client, MINIO_BUCKET
        # Prepare deletes queue path
        queue_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'deletes_queue.jsonl'))
        files = DocumentFile.query.filter_by(document_id=doc_id).all()
        for f in files:
            try:
                # Remove file from MinIO
                client.remove_object(MINIO_BUCKET, f.storage_key)
            except Exception as exc:
                try:
                    with open(queue_path, 'a') as qf:
                        # Log failed delete to queue for later processing
                        qf.write(json.dumps({'bucket': MINIO_BUCKET, 'key': f.storage_key}) + "\n")
                except Exception:
                    pass
    except Exception:
        pass

    # Delete document
    try:
        db.session.delete(doc)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'failed to delete document'}), 500

    return '', 204

