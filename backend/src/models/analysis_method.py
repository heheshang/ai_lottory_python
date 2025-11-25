"""
Analysis method model for defining different prediction algorithms
"""
from sqlalchemy import Column, String, Boolean, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from .base import BaseModel
from .associations import lottery_type_analysis_methods
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from database import db
except ImportError:
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()


class AnalysisMethod(BaseModel):
    """Analysis method model for defining different prediction algorithms"""
    __tablename__ = 'analysis_methods'

    name = Column(String(100), nullable=False)  # e.g., "Weighted Frequency Analysis"
    code = Column(String(50), unique=True, nullable=False)  # e.g., "WEIGHTED_FREQUENCY"

    description = Column(String(500))
    parameters_schema = Column(JSON, default={})  # JSON schema for method parameters

    # Configuration
    default_weight = Column(Float, default=1.0)
    requires_historical_data = Column(Boolean, default=True)
    implementation_class = Column(String(255), nullable=False)

    # Status
    is_active = Column(Boolean, default=True)

    # Relationships
    user_predictions = relationship('UserPrediction', back_populates='analysis_method')
    lottery_types = relationship('LotteryType', secondary=lottery_type_analysis_methods, back_populates='analysis_methods')

    def __repr__(self):
        return f'<AnalysisMethod {self.name}>'

    def get_parameters_schema(self):
        """Get JSON schema for method parameters"""
        return self.parameters_schema or {}

    def validate_parameters(self, parameters):
        """Validate parameters against schema"""
        if not self.parameters_schema:
            return True, "No parameter validation required"

        # Basic validation - can be enhanced with jsonschema
        required_params = self.parameters_schema.get('required', [])
        properties = self.parameters_schema.get('properties', {})

        # Check required parameters
        for param in required_params:
            if param not in parameters:
                return False, f"Missing required parameter: {param}"

        # Check parameter types
        for param_name, param_value in parameters.items():
            if param_name in properties:
                param_schema = properties[param_name]
                expected_type = param_schema.get('type')

                if expected_type == 'number' and not isinstance(param_value, (int, float)):
                    return False, f"Parameter {param_name} must be a number"
                elif expected_type == 'integer' and not isinstance(param_value, int):
                    return False, f"Parameter {param_name} must be an integer"
                elif expected_type == 'string' and not isinstance(param_value, str):
                    return False, f"Parameter {param_name} must be a string"
                elif expected_type == 'array' and not isinstance(param_value, list):
                    return False, f"Parameter {param_name} must be an array"
                elif expected_type == 'object' and not isinstance(param_value, dict):
                    return False, f"Parameter {param_name} must be an object"

                # Check ranges
                if expected_type in ['number', 'integer']:
                    minimum = param_schema.get('minimum')
                    maximum = param_schema.get('maximum')
                    if minimum is not None and param_value < minimum:
                        return False, f"Parameter {param_name} must be >= {minimum}"
                    if maximum is not None and param_value > maximum:
                        return False, f"Parameter {param_name} must be <= {maximum}"

        return True, "Parameters are valid"

    def get_default_parameters(self):
        """Get default parameters for this analysis method"""
        if not self.parameters_schema or 'properties' not in self.parameters_schema:
            return {}

        properties = self.parameters_schema['properties']
        defaults = {}

        for param_name, param_schema in properties.items():
            if 'default' in param_schema:
                defaults[param_name] = param_schema['default']

        return defaults