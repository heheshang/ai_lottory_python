"""
Base model class for SQLAlchemy models
"""
import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

# Import db from the database module to avoid circular imports
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from database import db
except ImportError:
    # Fallback for migration environment
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

class BaseModel(db.Model):
    """Base model class with common fields"""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def save(self):
        """Save model to database"""
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """Delete model from database"""
        db.session.delete(self)
        db.session.commit()