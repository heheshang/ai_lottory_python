"""
Environment configuration loader utilities
"""
import os
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def load_env_file(env_file: str = '.env') -> Dict[str, Any]:
    """
    Load environment variables from .env file

    Args:
        env_file: Path to the .env file

    Returns:
        Dictionary of environment variables
    """
    env_vars = {}

    try:
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()

                        # Remove quotes if present
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]

                        env_vars[key] = value
                        os.environ[key] = value

            logger.info(f"Loaded {len(env_vars)} environment variables from {env_file}")
        else:
            logger.warning(f"Environment file {env_file} not found")

    except Exception as e:
        logger.error(f"Error loading environment file {env_file}: {str(e)}")

    return env_vars

def get_env_var(key: str, default: Any = None, var_type: type = str) -> Any:
    """
    Get environment variable with type conversion

    Args:
        key: Environment variable key
        default: Default value if not found
        var_type: Type to convert to (str, int, float, bool)

    Returns:
        Environment variable value converted to specified type
    """
    value = os.environ.get(key, default)

    if value is None:
        return default

    # Handle boolean conversion
    if var_type == bool:
        return value.lower() in ('true', '1', 'yes', 'on', 'enabled')

    # Handle numeric conversion
    try:
        if var_type == int:
            return int(value)
        elif var_type == float:
            return float(value)
    except (ValueError, TypeError) as e:
        logger.warning(f"Could not convert {key}={value} to {var_type.__name__}: {str(e)}")
        return default

    return value

def validate_required_env_vars(required_vars: list) -> bool:
    """
    Validate that required environment variables are present

    Args:
        required_vars: List of required environment variable names

    Returns:
        True if all required variables are present, False otherwise
    """
    missing_vars = []

    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)

    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        return False

    return True

def validate_constitutional_compliance() -> bool:
    """
    Validate that constitutional compliance settings are correct

    Returns:
        True if compliance settings are valid, False otherwise
    """
    compliance_vars = {
        'MAX_PREDICTION_CONFIDENCE': 0.85,
        'RESPONSIBLE_GAMBLING_REQUIRED': True,
        'ETHICAL_DISCLAIMERS_ENABLED': True,
        'STATISTICAL_VALIDATION_ENABLED': True,
        'CONFIDENCE_INTERVALS_REQUIRED': True,
        'PREDICTION_TRANSPARENCY_REQUIRED': True
    }

    for var, expected_value in compliance_vars.items():
        actual_value = get_env_var(var, var_type=type(expected_value))

        if actual_value != expected_value:
            logger.error(f"Constitutional compliance violation: {var}={actual_value} (expected {expected_value})")
            return False

    logger.info("Constitutional compliance validation passed")
    return True

def get_database_config() -> Dict[str, Any]:
    """
    Get database configuration from environment variables

    Returns:
        Dictionary with database configuration
    """
    config = {}

    # Basic connection
    config['database_url'] = get_env_var('DATABASE_URL')
    config['track_modifications'] = get_env_var('SQLALCHEMY_TRACK_MODIFICATIONS', False, bool)
    config['echo'] = get_env_var('SQLALCHEMY_ECHO', False, bool)

    # Production pool settings
    if get_env_var('FLASK_ENV') == 'production':
        config['pool_size'] = get_env_var('SQLALCHEMY_POOL_SIZE', 10, int)
        config['pool_timeout'] = get_env_var('SQLALCHEMY_POOL_TIMEOUT', 20, int)
        config['pool_recycle'] = get_env_var('SQLALCHEMY_POOL_RECYCLE', 3600, int)

    return config

def get_cors_origins() -> list:
    """
    Get CORS origins from environment variable

    Returns:
        List of CORS origins
    """
    origins_str = get_env_var('CORS_ORIGINS', '')

    if not origins_str:
        return []

    return [origin.strip() for origin in origins_str.split(',') if origin.strip()]

def get_jwt_config() -> Dict[str, Any]:
    """
    Get JWT configuration from environment variables

    Returns:
        Dictionary with JWT configuration
    """
    return {
        'secret_key': get_env_var('JWT_SECRET_KEY'),
        'access_token_expires': get_env_var('JWT_ACCESS_TOKEN_EXPIRES', 3600, int),
        'refresh_token_expires': get_env_var('JWT_REFRESH_TOKEN_EXPIRES', 86400, int)
    }

def get_cache_config() -> Dict[str, Any]:
    """
    Get cache configuration from environment variables

    Returns:
        Dictionary with cache configuration
    """
    return {
        'type': get_env_var('CACHE_TYPE', 'simple'),
        'default_timeout': get_env_var('CACHE_DEFAULT_TIMEOUT', 300, int),
        'redis_url': get_env_var('CACHE_REDIS_URL')
    }

def get_logging_config() -> Dict[str, Any]:
    """
    Get logging configuration from environment variables

    Returns:
        Dictionary with logging configuration
    """
    return {
        'level': get_env_var('LOG_LEVEL', 'INFO'),
        'format': get_env_var('LOG_FORMAT', '%(asctime)s %(levelname)s %(name)s: %(message)s'),
        'file_enabled': get_env_var('LOG_FILE_ENABLED', True, bool),
        'file_path': get_env_var('LOG_FILE_PATH', 'logs/lottery_prediction.log'),
        'max_bytes': get_env_var('LOG_FILE_MAX_BYTES', 10485760, int),  # 10MB
        'backup_count': get_env_var('LOG_FILE_BACKUP_COUNT', 10, int)
    }

def get_ml_config() -> Dict[str, Any]:
    """
    Get ML/AI configuration from environment variables

    Returns:
        Dictionary with ML configuration
    """
    return {
        'langchain_api_key': get_env_var('LANGCHAIN_API_KEY'),
        'openai_api_key': get_env_var('OPENAI_API_KEY'),
        'huggingface_api_key': get_env_var('HUGGINGFACE_API_KEY'),
        'model_cache_ttl': get_env_var('ML_MODEL_CACHE_TTL', 3600, int),
        'max_concurrent_predictions': get_env_var('ML_MAX_CONCURRENT_PREDICTIONS', 10, int),
        'enable_fallback_mode': get_env_var('ML_ENABLE_FALLBACK_MODE', True, bool)
    }

def load_configuration(env_file: str = '.env') -> Dict[str, Any]:
    """
    Load complete configuration from environment variables

    Args:
        env_file: Path to the .env file

    Returns:
        Dictionary with complete configuration
    """
    # Load environment variables from file
    load_env_file(env_file)

    # Build configuration dictionary
    config = {
        'flask_env': get_env_var('FLASK_ENV', 'development'),
        'debug': get_env_var('FLASK_DEBUG', False, bool),
        'secret_key': get_env_var('SECRET_KEY'),

        'database': get_database_config(),
        'cors_origins': get_cors_origins(),
        'jwt': get_jwt_config(),
        'cache': get_cache_config(),
        'logging': get_logging_config(),
        'ml': get_ml_config(),

        # Constitutional compliance
        'constitutional': {
            'max_prediction_confidence': get_env_var('MAX_PREDICTION_CONFIDENCE', 0.85, float),
            'responsible_gambling_required': get_env_var('RESPONSIBLE_GAMBLING_REQUIRED', True, bool),
            'ethical_disclaimers_enabled': get_env_var('ETHICAL_DISCLAIMERS_ENABLED', True, bool),
            'statistical_validation_enabled': get_env_var('STATISTICAL_VALIDATION_ENABLED', True, bool),
            'confidence_intervals_required': get_env_var('CONFIDENCE_INTERVALS_REQUIRED', True, bool),
            'prediction_transparency_required': get_env_var('PREDICTION_TRANSPARENCY_REQUIRED', True, bool)
        },

        # Performance settings
        'prediction_timeout': get_env_var('PREDICTION_TIMEOUT', 3, int),
        'data_access_timeout': get_env_var('DATA_ACCESS_TIMEOUT', 30, int),
        'ratelimit_enabled': get_env_var('RATELIMIT_ENABLED', False, bool),

        # Testing
        'testing': get_env_var('TESTING', False, bool)
    }

    # Validate constitutional compliance
    if not validate_constitutional_compliance():
        raise ValueError("Constitutional compliance validation failed")

    return config

def print_configuration_summary(config: Dict[str, Any]) -> None:
    """
    Print a summary of the loaded configuration (for debugging)

    Args:
        config: Configuration dictionary
    """
    logger.info("=== Configuration Summary ===")
    logger.info(f"Environment: {config['flask_env']}")
    logger.info(f"Debug: {config['debug']}")
    logger.info(f"Database: {config['database']['database_url']}")
    logger.info(f"CORS Origins: {len(config['cors_origins'])} origins configured")
    logger.info(f"Cache Type: {config['cache']['type']}")
    logger.info(f"Rate Limiting: {config['ratelimit_enabled']}")
    logger.info(f"Constitutional Compliance: ✓ Enabled")
    logger.info("=== End Configuration Summary ===")