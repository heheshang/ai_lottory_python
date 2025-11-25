"""
User profile model for lottery prediction website
"""
from sqlalchemy import Column, String, Boolean, Integer, Enum
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
import enum

from .base import BaseModel
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from database import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()


class RiskTolerance(enum.Enum):
    """User risk tolerance levels"""
    CONSERVATIVE = 'conservative'
    MODERATE = 'moderate'
    AGGRESSIVE = 'aggressive'


class User(BaseModel):
    """User model for managing user accounts and preferences"""
    __tablename__ = 'users'

    # Primary fields
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # User preferences and settings
    preferences = Column(JSON, default=lambda: {
        'preferred_analysis_methods': ['weighted_frequency'],
        'default_confidence_threshold': 0.7,
        'notifications_enabled': True,
        'theme': 'light'
    })

    # Behavioral settings
    risk_tolerance = Column(Enum(RiskTolerance), default=RiskTolerance.MODERATE)
    max_predictions_daily = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)

    # Ethical compliance
    responsible_gambling_acknowledged = Column(Boolean, default=False)
    self_exclusion_until = Column(db.DateTime, nullable=True)

    # Relationships
    user_sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    user_predictions = relationship('UserPrediction', back_populates='user', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

    def is_prediction_limit_reached(self, current_count):
        """Check if user has reached daily prediction limit"""
        return current_count >= self.max_predictions_daily

    def can_make_predictions(self):
        """Check if user is allowed to make predictions"""
        if not self.is_active:
            return False, "Account is not active"

        if self.self_exclusion_until and self.self_exclusion_until > db.datetime.utcnow():
            return False, "User is self-excluded"

        if not self.responsible_gambling_acknowledged:
            return False, "Responsible gambling not acknowledged"

        return True, "User can make predictions"