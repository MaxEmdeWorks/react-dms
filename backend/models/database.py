"""
Database models for the DMS application.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

def utc_now():
    """Return current UTC time using timezone-aware datetime."""
    return datetime.now(timezone.utc)

class Document(db.Model):
    """Model for documents in the Document Management System."""
    __tablename__ = 'documents'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    tags = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='active')  # 'active' or 'archived'
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    def to_dict(self):
        """Convert Document instance to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'tags': self.tags,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

class DocumentFile(db.Model):
    """Model for metadata of a file stored in object storage.

    The actual file content is stored externally (S3/MinIO). This model stores
    metadata and the storage key required to retrieve the object.
    """
    __tablename__ = 'document_files'

    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False)
    storage_key = db.Column(db.String(512), nullable=False)  # object key or URL path in the bucket
    filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=True)
    size = db.Column(db.Integer, nullable=True)
    sha256 = db.Column(db.String(64), nullable=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

    # relationship to document
    document = db.relationship('Document', backref=db.backref('files', cascade='all, delete-orphan', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'storage_key': self.storage_key,
            'filename': self.filename,
            'content_type': self.content_type,
            'size': self.size,
            'sha256': self.sha256,
            'version': self.version,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

