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

