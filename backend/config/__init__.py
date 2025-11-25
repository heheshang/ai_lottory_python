"""
Configuration module for Flask application
"""
import os
from datetime import timedelta


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')
    MAX_PREDICTION_CONFIDENCE = 0.85  # Constitutional compliance: cap at 85%
    RESPONSIBLE_GAMBLING_REQUIRED = True
    STATISTICAL_VALIDATION_ENABLED = True

    # Performance requirements
    PREDICTION_TIMEOUT = 3  # seconds
    DATA_ACCESS_TIMEOUT = 30  # seconds

    # Ethical compliance
    ETHICAL_DISCLAIMERS_ENABLED = True
    CONFIDENCE_INTERVALS_REQUIRED = True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///lottery_dev.db'
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://user:password@localhost/lottery_db'

    # Production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}