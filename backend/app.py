"""
Flask Application Factory for Lottery Prediction Website
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import os

# Initialize extensions
db = SQLAlchemy()
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


def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)

    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    from config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Register models with SQLAlchemy
    with app.app_context():
        register_models()

    # Register blueprints (will be implemented in T011)
    # from src.api import predictions, historical_data, user_data, analytics
    # app.register_blueprint(predictions.bp)
    # app.register_blueprint(historical_data.bp)
    # app.register_blueprint(user_data.bp)
    # app.register_blueprint(analytics.bp)

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'version': '1.0.0'}

    return app