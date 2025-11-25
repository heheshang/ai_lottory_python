"""
User session model for tracking user activity
"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel
from backend.app import db


class UserSession(BaseModel):
    """User session model for tracking user activity and preferences"""
    __tablename__ = 'user_sessions'

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    session_start = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)

    # Session data for personalization
    session_data = Column(JSON, default={})
    predictions_count = Column(Integer, default=0)

    # Security and analytics
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)

    # Relationships
    user = relationship('User', back_populates='user_sessions')

    def __repr__(self):
        return f'<UserSession {self.id} for User {self.user_id}>'

    def update_activity(self):
        """Update last activity timestamp"""
        self.last_activity = datetime.utcnow()

    def increment_predictions(self):
        """Increment prediction count for this session"""
        self.predictions_count += 1

    def is_expired(self, max_hours=24):
        """Check if session has expired"""
        return (datetime.utcnow() - self.last_activity).total_seconds() > (max_hours * 3600)