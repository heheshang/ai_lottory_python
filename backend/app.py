"""
Flask Application Factory for Lottery Prediction Website
"""
from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os
import logging
from logging.handlers import RotatingFileHandler

# Initialize extensions
from database import db
migrate = Migrate()

# Import models to ensure they are registered with SQLAlchemy
# This is done in a separate function to avoid circular imports
def register_models():
    """Register all models with SQLAlchemy"""
    from src.models import (
        User, UserSession, LotteryType, LotteryDraw,
        AnalysisMethod, UserPrediction, HistoricalAnalysis
    )
    return [User, UserSession, LotteryType, LotteryDraw,
            AnalysisMethod, UserPrediction, HistoricalAnalysis]


def configure_logging(app):
    """Configure logging for the application"""
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')

        file_handler = RotatingFileHandler(
            'logs/lottery_prediction.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            app.config['LOG_FORMAT']
        ))
        file_handler.setLevel(logging.INFO)

        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Lottery Prediction startup')


def configure_cors(app):
    """Configure CORS settings"""
    origins = app.config.get('CORS_ORIGINS', [])
    CORS(app, origins=origins, supports_credentials=True)


def register_blueprints(app):
    """Register application blueprints"""
    # Register API blueprints
    from src.api import auth_bp, predictions_bp, historical_data_bp, user_data_bp, analytics_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(predictions_bp)
    app.register_blueprint(historical_data_bp)
    app.register_blueprint(user_data_bp)
    app.register_blueprint(analytics_bp)

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy',
            'version': '1.0.0',
            'environment': app.config.get('FLASK_ENV', 'development'),
            'endpoints': [
                '/api/auth/* - Authentication endpoints',
                '/api/predictions/* - Prediction generation endpoints',
                '/api/historical/* - Historical data endpoints',
                '/api/user/* - User management endpoints',
                '/api/analytics/* - Analytics endpoints'
            ]
        }

    # Root endpoint with API information
    @app.route('/')
    def api_info():
        return {
            'name': 'Lottery Prediction API',
            'version': '1.0.0',
            'status': 'operational',
            'ethical_compliance': {
                'confidence_capped': True,
                'responsible_gambling': True,
                'statistical_validation': True
            },
            'endpoints': {
                'health': '/health',
                'authentication': '/api/auth/*',
                'predictions': '/api/predictions/*',
                'historical_data': '/api/historical/*',
                'user_data': '/api/user/*',
                'analytics': '/api/analytics/*'
            }
        }

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({'error': 'Bad request'}), 400

    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({'error': 'Forbidden'}), 403

    # CORS error handling
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Method not allowed'}), 405


def create_app(config_name=None):
    """
    Application factory pattern

    Args:
        config_name (str): Configuration name (development, testing, production)

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    from config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    configure_cors(app)

    # Configure logging
    configure_logging(app)

    # Register models with SQLAlchemy (disabled for now)
    # with app.app_context():
    #     register_models()

    # Register blueprints and error handlers
    register_blueprints(app)

    # Application startup logging
    app.logger.info(f"Lottery Prediction Website started in {config_name} mode")

    return app