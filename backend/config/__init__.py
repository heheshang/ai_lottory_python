"""
Configuration module for Flask application
"""
import os
from datetime import timedelta


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')

    # Constitutional compliance settings
    MAX_PREDICTION_CONFIDENCE = 0.85  # Cap at 85%
    RESPONSIBLE_GAMBLING_REQUIRED = True
    STATISTICAL_VALIDATION_ENABLED = True

    # Performance requirements
    PREDICTION_TIMEOUT = 3  # seconds
    DATA_ACCESS_TIMEOUT = 30  # seconds

    # Ethical compliance
    ETHICAL_DISCLAIMERS_ENABLED = True
    CONFIDENCE_INTERVALS_REQUIRED = True

    # CORS settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:8080']

    # File upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # Logging
    LOG_LEVEL = 'INFO'
    LOG_FORMAT = '%(asctime)s %(levelname)s %(name)s: %(message)s'

    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///lottery_dev.db'
    SQLALCHEMY_ECHO = True  # Enable SQL logging in development
    TESTING = False

    # Development CORS settings - allow more origins
    CORS_ORIGINS = [
        'http://localhost:3000', 'http://localhost:8080',
        'http://127.0.0.1:3000', 'http://127.0.0.1:8080'
    ]


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG = False
    SQLALCHEMY_ECHO = False
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing

    # Disable some features for testing
    ETHICAL_DISCLAIMERS_ENABLED = True  # Keep enabled for ethical compliance testing
    LANGCHAIN_API_KEY = 'test-key'  # Use test key for unit tests


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://user:password@localhost/lottery_db'
    SQLALCHEMY_ECHO = False

    # Production security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Production CORS settings - restrict to specific domains
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',') if os.environ.get('CORS_ORIGINS') else []

    # Production logging
    LOG_LEVEL = 'WARNING'

    # Performance optimizations for production
    CACHE_TYPE = 'redis'  # Use Redis in production
    CACHE_DEFAULT_TIMEOUT = 600

    # Production rate limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/1')

    # Additional production settings
    PREFERRED_URL_SCHEME = 'https'


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}