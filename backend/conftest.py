"""
Pytest configuration and fixtures for lottery prediction website
"""
import pytest
import tempfile
import os
from app import create_app, db
from sqlalchemy import event


@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    # Create temp database file
    db_fd, db_path = tempfile.mkstemp()

    app = create_app('testing')
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'WTF_CSRF_ENABLED': False,
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

    # Clean up temp database
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture(scope='function')
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture(scope='function')
def runner(app):
    """Create CLI test runner"""
    return app.test_cli_runner()


@pytest.fixture(scope='function')
def session(app):
    """Create database session for tests"""
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        session = db.session

        # Begin a nested transaction (uses SAVEPOINT)
        nested = connection.begin_nested()

        # If an exception occurs, rollback the transaction
        @event.listens_for(session, "after_transaction_end")
        def end_savepoint(session, transaction):
            if transaction.nested and not transaction._parent:
                nested.rollback()

        yield session

        # Rollback everything
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope='function')
def sample_lottery_data():
    """Sample historical lottery data for testing"""
    return {
        'lottery_type': 'china_welfare_lottery',
        'draws': [
            {'date': '2024-01-01', 'numbers': [1, 5, 12, 23, 35], 'special_number': 8},
            {'date': '2024-01-08', 'numbers': [3, 7, 15, 28, 33], 'special_number': 12},
            {'date': '2024-01-15', 'numbers': [2, 9, 18, 25, 31], 'special_number': 4},
            {'date': '2024-01-22', 'numbers': [6, 11, 19, 27, 34], 'special_number': 10},
            {'date': '2024-01-29', 'numbers': [4, 13, 21, 29, 32], 'special_number': 6},
        ]
    }


@pytest.fixture(scope='function')
def prediction_request_data():
    """Sample prediction request data for testing"""
    return {
        'lottery_type': 'china_welfare_lottery',
        'prediction_methods': ['weighted_frequency', 'markov_chains'],
        'confidence_threshold': 0.75,
        'include_explanation': True
    }


# Ethical compliance fixtures
@pytest.fixture(scope='function')
def ethical_disclaimers():
    """Ethical disclaimer text for compliance testing"""
    return {
        'max_confidence': 85,  # Constitutional compliance: cap at 85%
        'responsible_gambling': True,
        'data_driven_only': True,
        'statistical_validation': True
    }


# Statistical validation fixtures
@pytest.fixture(scope='function')
def statistical_requirements():
    """Statistical validation requirements"""
    return {
        'min_confidence_interval': 0.1,  # 10% minimum CI width
        'min_historical_data_points': 100,
        'cross_validation_folds': 5,
        'significance_level': 0.05
    }


# Performance fixtures
@pytest.fixture(scope='function')
def performance_requirements():
    """Performance requirements for testing"""
    return {
        'max_prediction_time': 3.0,  # 3 seconds
        'max_data_access_time': 30.0,  # 30 seconds
        'max_memory_usage': 512 * 1024 * 1024  # 512MB
    }


# Markers for different test categories
def pytest_configure(config):
    """Configure custom pytest markers"""
    config.addinivalue_line(
        "markers", "unit: Mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: Mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "contract: Mark test as a contract test"
    )
    config.addinivalue_line(
        "markers", "ethical: Mark test as an ethical compliance test"
    )
    config.addinivalue_line(
        "markers", "statistical: Mark test as a statistical validation test"
    )
    config.addinivalue_line(
        "markers", "api: Mark test as an API endpoint test"
    )
    config.addinivalue_line(
        "markers", "ml: Mark test as a machine learning model test"
    )
    config.addinivalue_line(
        "markers", "slow: Mark test as slow running"
    )


# Custom assertions for constitutional compliance
def assert_ethical_compliance(prediction_result):
    """Assert that prediction results meet ethical compliance requirements"""
    assert prediction_result.get('confidence_score', 0) <= 85.0, \
        "Confidence score exceeds constitutional maximum of 85%"
    assert 'responsible_gambling_disclaimer' in prediction_result, \
        "Missing responsible gambling disclaimer"
    assert 'statistical_disclaimer' in prediction_result, \
        "Missing statistical disclaimer"


def assert_statistical_validation(prediction_result):
    """Assert that prediction results meet statistical validation requirements"""
    assert 'confidence_interval' in prediction_result, \
        "Missing confidence interval"
    assert len(prediction_result['confidence_interval']) == 2, \
        "Confidence interval must have upper and lower bounds"
    assert prediction_result['confidence_interval'][1] > prediction_result['confidence_interval'][0], \
        "Upper confidence bound must be greater than lower bound"


# Make custom assertions available to tests
pytest.assert_ethical_compliance = assert_ethical_compliance
pytest.assert_statistical_validation = assert_statistical_validation