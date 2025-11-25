"""
User prediction model for storing user-generated predictions
"""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, Boolean, Index, Enum
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
import enum

from .base import BaseModel
from backend.app import db


class PredictionSource(enum.Enum):
    """Prediction source types"""
    WEB = 'web'
    API = 'api'
    BATCH = 'batch'


class UserPrediction(BaseModel):
    """User prediction model for storing user-generated predictions"""
    __tablename__ = 'user_predictions'

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    lottery_type_id = Column(UUID(as_uuid=True), ForeignKey('lottery_types.id'), nullable=False)
    analysis_method_id = Column(UUID(as_uuid=True), ForeignKey('analysis_methods.id'), nullable=True)

    # Prediction results
    predicted_numbers = Column(JSON, nullable=False)  # Example: {"main_numbers": [3, 11, 17, 24, 33], "bonus_numbers": [2, 9]}
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    confidence_intervals = Column(JSON, default={})  # Example: {"main_numbers": [[1, 8], [9, 15], [16, 22], [23, 29], [30, 35]], "bonus_numbers": [[1, 6], [7, 12]]}

    # Analysis metadata
    analysis_metadata = Column(JSON, default={})  # Example: {"methods_used": ["weighted_frequency", "markov_chains"], "method_weights": {"weighted_frequency": 0.6, "markov_chains": 0.4}}

    # User interaction and feedback
    user_feedback = Column(JSON, default={
        'rating': None,
        'comments': None,
        'helpfulness': None
    })

    actual_accuracy = Column(Float, nullable=True)  # Calculated after actual draw
    is_bookmarked = Column(Boolean, default=False)
    prediction_source = Column(Enum(PredictionSource), default=PredictionSource.WEB)

    # Ethical compliance
    responsible_gambling_shown = Column(Boolean, default=True)
    disclaimer_acknowledged = Column(Boolean, default=False)

    # Performance indexes
    __table_args__ = (
        Index('idx_user_created', 'user_id', 'created_at'),
        Index('idx_lottery_type_date', 'lottery_type_id', 'created_at'),
    )

    # Relationships
    user = relationship('User', back_populates='user_predictions')
    lottery_type = relationship('LotteryType', back_populates='user_predictions')
    analysis_method = relationship('AnalysisMethod', back_populates='user_predictions')

    def __repr__(self):
        return f'<UserPrediction {self.id} by User {self.user_id}>'

    def get_main_numbers(self):
        """Get main predicted numbers"""
        return self.predicted_numbers.get('main_numbers', []) if self.predicted_numbers else []

    def get_bonus_numbers(self):
        """Get bonus predicted numbers"""
        return self.predicted_numbers.get('bonus_numbers', []) if self.predicted_numbers else []

    def get_all_numbers(self):
        """Get all predicted numbers (main + bonus)"""
        main_nums = self.get_main_numbers()
        bonus_nums = self.get_bonus_numbers()
        return main_nums + bonus_nums

    def calculate_accuracy(self, actual_draw):
        """Calculate prediction accuracy against actual draw"""
        if not actual_draw or not self.predicted_numbers:
            return 0.0

        matches = actual_draw.calculate_matches(self.predicted_numbers)
        main_matches = matches['main_matches']
        bonus_matches = matches['bonus_matches']

        # Simple accuracy calculation (can be refined)
        total_numbers = len(self.get_main_numbers()) + len(self.get_bonus_numbers())
        if total_numbers == 0:
            return 0.0

        accuracy = (main_matches + bonus_matches) / total_numbers
        return accuracy

    def update_accuracy(self, actual_draw):
        """Update accuracy based on actual draw results"""
        self.actual_accuracy = self.calculate_accuracy(actual_draw)
        return self.actual_accuracy

    def is_valid_confidence_score(self):
        """Check if confidence score is within ethical limits"""
        # Constitutional requirement: Cap at 0.85
        max_confidence = 0.85
        return 0.0 <= self.confidence_score <= max_confidence

    def validate_ethical_compliance(self):
        """Validate prediction meets ethical requirements"""
        errors = []

        # Check confidence score cap
        if not self.is_valid_confidence_score():
            errors.append(f"Confidence score {self.confidence_score} exceeds ethical limit of 0.85")

        # Check confidence intervals are present
        if not self.confidence_intervals:
            errors.append("Confidence intervals are required for ethical compliance")

        # Check disclaimer acknowledgment
        if not self.disclaimer_acknowledged:
            errors.append("Prediction disclaimer must be acknowledged")

        # Check responsible gambling shown
        if not self.responsible_gambling_shown:
            errors.append("Responsible gambling information must be shown")

        return len(errors) == 0, errors

    def get_explanation(self):
        """Get human-readable explanation of the prediction"""
        if not self.analysis_metadata:
            return "No analysis metadata available"

        methods_used = self.analysis_metadata.get('methods_used', [])
        method_weights = self.analysis_metadata.get('method_weights', {})

        explanation_parts = []
        for method in methods_used:
            weight = method_weights.get(method, 0)
            explanation_parts.append(f"{method} (weight: {weight})")

        if explanation_parts:
            return f"Prediction generated using: {', '.join(explanation_parts)}"
        else:
            return "Prediction generated using statistical analysis methods"

    def to_dict_with_details(self):
        """Convert to dictionary including related entity details"""
        result = self.to_dict()

        if self.user:
            result['user'] = {
                'username': self.user.username,
                'risk_tolerance': self.user.risk_tolerance.value
            }

        if self.lottery_type:
            result['lottery_type'] = {
                'name': self.lottery_type.name,
                'code': self.lottery_type.code
            }

        if self.analysis_method:
            result['analysis_method'] = {
                'name': self.analysis_method.name,
                'description': self.analysis_method.description
            }

        return result