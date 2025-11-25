"""
API package initialization
"""
from .auth import auth_bp
from .predictions import predictions_bp
from .historical_data import historical_data_bp
from .user_data import user_data_bp
from .analytics import analytics_bp

__all__ = [
    'auth_bp',
    'predictions_bp',
    'historical_data_bp',
    'user_data_bp',
    'analytics_bp'
]