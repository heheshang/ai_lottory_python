"""
Ethical compliance validators for various aspects of the lottery prediction system
"""
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class PredictionValidator:
    """Validates predictions against ethical and constitutional requirements"""

    def __init__(self, max_confidence: float = 0.85):
        """
        Initialize the prediction validator

        Args:
            max_confidence: Maximum allowed confidence score (constitutional requirement)
        """
        self.max_confidence = max_confidence
        self.required_fields = ['predicted_numbers', 'method', 'user_id']

    def validate_prediction_structure(self, prediction_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate the basic structure and required fields of a prediction

        Args:
            prediction_data: Prediction data dictionary

        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []

        # Check required fields
        for field in self.required_fields:
            if field not in prediction_data:
                errors.append(f"Missing required field: {field}")

        # Validate predicted numbers structure
        if 'predicted_numbers' in prediction_data:
            numbers = prediction_data['predicted_numbers']
            if not isinstance(numbers, dict):
                errors.append("Predicted numbers must be a dictionary")
            else:
                # Check for required number types
                if 'main_numbers' not in numbers:
                    errors.append("Main numbers are required")

                # Validate number lists
                for num_type, num_list in numbers.items():
                    if not isinstance(num_list, list):
                        errors.append(f"{num_type} must be a list")
                    elif not num_list:
                        errors.append(f"{num_type} cannot be empty")
                    elif not all(isinstance(num, int) and num > 0 for num in num_list):
                        errors.append(f"All {num_type} must be positive integers")

        # Validate method
        if 'method' in prediction_data:
            method = prediction_data['method']
            valid_methods = ['weighted_frequency', 'markov_chains', 'ensemble_methods', 'time_series_analysis']
            if method not in valid_methods:
                errors.append(f"Invalid prediction method: {method}")

        return len(errors) == 0, errors

    def validate_prediction_transparency(self, prediction_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that prediction includes required transparency information

        Args:
            prediction_data: Prediction data dictionary

        Returns:
            Tuple of (is_transparent, missing_transparency_items)
        """
        missing_items = []

        # Check for analysis metadata
        if 'analysis_metadata' not in prediction_data:
            missing_items.append("Analysis metadata is required for transparency")
        else:
            metadata = prediction_data['analysis_metadata']
            required_metadata = ['method', 'sample_size', 'statistical_significance']
            for item in required_metadata:
                if item not in metadata:
                    missing_items.append(f"Analysis metadata missing: {item}")

        # Check for explanation
        if 'explanation' not in prediction_data:
            missing_items.append("Prediction explanation is required")

        # Check for method parameters
        if 'parameters' not in prediction_data:
            missing_items.append("Method parameters are required")

        return len(missing_items) == 0, missing_items

class ConfidenceValidator:
    """Validates and enforces confidence score limits according to constitutional requirements"""

    def __init__(self, max_confidence: float = 0.85):
        """
        Initialize the confidence validator

        Args:
            max_confidence: Maximum allowed confidence score (constitutional requirement)
        """
        self.max_confidence = max_confidence

    def validate_confidence_score(self, confidence: float) -> Tuple[float, bool, str]:
        """
        Validate and adjust confidence score to meet constitutional requirements

        Args:
            confidence: Original confidence score

        Returns:
            Tuple of (adjusted_confidence, is_compliant, message)
        """
        original_confidence = confidence

        # Ensure confidence is in valid range
        if confidence < 0.0:
            confidence = 0.0
            return confidence, False, f"Invalid negative confidence score {original_confidence}, set to 0.0"

        if confidence > 1.0:
            confidence = 1.0
            return confidence, False, f"Invalid confidence score {original_confidence} > 1.0, set to 1.0"

        # Apply constitutional confidence cap
        if confidence > self.max_confidence:
            confidence = self.max_confidence
            return confidence, False, f"Confidence score capped at constitutional maximum of {self.max_confidence}"

        return confidence, True, "Confidence score is compliant"

    def validate_confidence_intervals(self, intervals: Dict[str, List[List[int]]], numbers: Dict[str, List[int]]) -> Tuple[bool, List[str]]:
        """
        Validate confidence intervals for predicted numbers

        Args:
            intervals: Confidence intervals dictionary
            numbers: Predicted numbers dictionary

        Returns:
            Tuple of (is_valid, error_messages)
        """
        errors = []

        if not intervals:
            errors.append("Confidence intervals are required")
            return False, errors

        # Validate intervals for each number type
        for num_type, num_list in numbers.items():
            if num_type not in intervals:
                errors.append(f"Confidence intervals missing for {num_type}")
                continue

            type_intervals = intervals[num_type]

            if len(type_intervals) != len(num_list):
                errors.append(f"Number of confidence intervals doesn't match number of {num_type}")

            # Validate each interval
            for i, interval in enumerate(type_intervals):
                if len(interval) != 2:
                    errors.append(f"Invalid interval format for {num_type}[{i}]: must be [min, max]")

                elif interval[0] > interval[1]:
                    errors.append(f"Invalid interval for {num_type}[{i}]: min > max")

                elif i < len(num_list) and not (interval[0] <= num_list[i] <= interval[1]):
                    errors.append(f"Predicted number {num_type}[{i}] not within its confidence interval")

        return len(errors) == 0, errors

class DisclaimerValidator:
    """Validates that required disclaimers are present and acknowledged"""

    def __init__(self):
        """Initialize the disclaimer validator"""
        self.required_disclaimers = [
            'lottery_randomness',
            'no_financial_advice',
            'responsible_gambling',
            'entertainment_only'
        ]

    def validate_disclaimer_acknowledgment(self, acknowledged_disclaimers: List[str]) -> Tuple[bool, List[str]]:
        """
        Validate that all required disclaimers have been acknowledged

        Args:
            acknowledged_disclaimers: List of acknowledged disclaimer types

        Returns:
            Tuple of (all_acknowledged, missing_disclaimers)
        """
        if not acknowledged_disclaimers:
            return False, self.required_disclaimers.copy()

        missing = []
        for required in self.required_disclaimers:
            if required not in acknowledged_disclaimers:
                missing.append(required)

        return len(missing) == 0, missing

    def validate_disclaimer_content(self, disclaimers: List[Dict[str, str]]) -> Tuple[bool, List[str]]:
        """
        Validate that disclaimer content meets requirements

        Args:
            disclaimers: List of disclaimer dictionaries

        Returns:
            Tuple of (content_valid, issues_found)
        """
        issues = []

        # Check that all required disclaimer types are present
        present_types = [d.get('type') for d in disclaimers if 'type' in d]
        for required_type in self.required_disclaimers:
            if required_type not in present_types:
                issues.append(f"Missing required disclaimer: {required_type}")

        # Validate content quality
        for disclaimer in disclaimers:
            disclaimer_type = disclaimer.get('type', 'unknown')

            if not disclaimer.get('text'):
                issues.append(f"Disclaimer {disclaimer_type} has no text")
            elif len(disclaimer['text']) < 20:
                issues.append(f"Disclaimer {disclaimer_type} text is too short")

            if not disclaimer.get('title'):
                issues.append(f"Disclaimer {disclaimer_type} has no title")

            # Check for key phrases in important disclaimers
            if disclaimer_type == 'lottery_randomness':
                text = disclaimer.get('text', '').lower()
                if 'random' not in text:
                    issues.append(f"Randomness disclaimer doesn't mention 'random'")
                if 'unpredictable' not in text:
                    issues.append(f"Randomness disclaimer doesn't mention 'unpredictable'")

        return len(issues) == 0, issues

class UserProtectionValidator:
    """Validates user protection and responsible gambling requirements"""

    def __init__(self, daily_limit: int = 50, hourly_limit: int = 20):
        """
        Initialize the user protection validator

        Args:
            daily_limit: Maximum predictions per day
            hourly_limit: Maximum predictions per hour
        """
        self.daily_limit = daily_limit
        self.hourly_limit = hourly_limit

    def validate_prediction_limits(self, user_activity: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that user hasn't exceeded prediction limits

        Args:
            user_activity: User activity data

        Returns:
            Tuple of (within_limits, limit_violations)
        """
        violations = []

        # Check daily limit
        daily_count = user_activity.get('daily_predictions', 0)
        if daily_count > self.daily_limit:
            violations.append(f"Daily prediction limit exceeded: {daily_count}/{self.daily_limit}")

        # Check hourly limit
        hourly_count = user_activity.get('hourly_predictions', 0)
        if hourly_count > self.hourly_limit:
            violations.append(f"Hourly prediction limit exceeded: {hourly_count}/{self.hourly_limit}")

        # Check rapid succession (more than 5 predictions in 5 minutes)
        rapid_count = user_activity.get('rapid_predictions_5min', 0)
        if rapid_count > 5:
            violations.append("Too many predictions in rapid succession")

        # Check for concerning patterns
        consecutive_days = user_activity.get('consecutive_active_days', 0)
        if consecutive_days > 30:
            violations.append("Extended daily usage pattern detected - consider break")

        return len(violations) == 0, violations

    def validate_user_state(self, user_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate user state for responsible gambling compliance

        Args:
            user_data: User profile and state data

        Returns:
            Tuple of (user_allowed, restriction_reasons)
        """
        restrictions = []

        # Check self-exclusion
        if user_data.get('self_exclusion_until'):
            exclusion_date = datetime.fromisoformat(user_data['self_exclusion_until'])
            if exclusion_date > datetime.utcnow():
                restrictions.append(f"User is self-excluded until {exclusion_date}")

        # Check cooling off period
        if user_data.get('cooling_off_until'):
            cooling_off_date = datetime.fromisoformat(user_data['cooling_off_until'])
            if cooling_off_date > datetime.utcnow():
                restrictions.append(f"User in cooling off period until {cooling_off_date}")

        # Check responsible gambling acknowledgment
        if not user_data.get('responsible_gambling_acknowledged', False):
            restrictions.append("Responsible gambling requirements not acknowledged")

        # Check age requirement (if age is available)
        if 'age' in user_data and user_data['age'] < 18:
            restrictions.append("User does not meet minimum age requirement")

        # Check if account is suspended
        if not user_data.get('is_active', True):
            restrictions.append("User account is not active")

        return len(restrictions) == 0, restrictions

    def check_concerning_patterns(self, user_activity: Dict[str, Any]) -> List[str]:
        """
        Check for concerning usage patterns that may require intervention

        Args:
            user_activity: User activity data

        Returns:
            List of concerning patterns detected
        """
        concerns = []

        # Check for late night usage (potential problem gambling indicator)
        late_night_predictions = user_activity.get('late_night_predictions', 0)  # 10 PM - 4 AM
        if late_night_predictions > 10:
            concerns.append("High frequency of late-night predictions detected")

        # Check for chase behavior (increasing frequency after losses)
        chase_score = user_activity.get('chase_behavior_score', 0)
        if chase_score > 0.7:
            concerns.append("Potential chase behavior detected")

        # Check for financial indicators
        total_predictions = user_activity.get('total_predictions', 0)
        if total_predictions > 1000:
            concerns.append("Very high total prediction count - possible gambling problem")

        # Check time spent on platform
        daily_time = user_activity.get('daily_time_minutes', 0)
        if daily_time > 300:  # 5 hours
            concerns.append("Excessive daily time spent on platform")

        # Check for multiple rapid sessions
        rapid_sessions = user_activity.get('rapid_sessions_per_day', 0)
        if rapid_sessions > 5:
            concerns.append("Multiple rapid sessions detected")

        return concerns

class StatisticalValidator:
    """Validates statistical analysis against constitutional requirements"""

    def __init__(self):
        """Initialize the statistical validator"""
        self.min_sample_size = 50
        self.required_significance_level = 0.05

    def validate_analysis_methodology(self, analysis_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate statistical analysis methodology

        Args:
            analysis_data: Statistical analysis data

        Returns:
            Tuple of (methodology_valid, issues_found)
        """
        issues = []

        # Check sample size
        sample_size = analysis_data.get('sample_size', 0)
        if sample_size < self.min_sample_size:
            issues.append(f"Sample size {sample_size} below minimum requirement of {self.min_sample_size}")

        # Check significance level
        significance = analysis_data.get('significance_level', 1.0)
        if significance > self.required_significance_level:
            issues.append(f"Significance level {significance} too high (threshold: {self.required_significance_level})")

        # Check method description
        if 'method' not in analysis_data:
            issues.append("Analysis method not specified")
        elif not analysis_data['method']:
            issues.append("Analysis method description is empty")

        # Check for confidence intervals
        if 'confidence_intervals' not in analysis_data:
            issues.append("Confidence intervals not provided")
        elif not analysis_data['confidence_intervals']:
            issues.append("Confidence intervals are empty")

        # Check for statistical significance reporting
        if 'statistical_significance' not in analysis_data:
            issues.append("Statistical significance not reported")

        return len(issues) == 0, issues

    def validate_prediction_explainability(self, prediction_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that prediction has sufficient explainability

        Args:
            prediction_data: Prediction data with analysis details

        Returns:
            Tuple of (explainable, missing_explanations)
        """
        missing = []

        # Check for feature importance
        if 'feature_importance' not in prediction_data:
            missing.append("Feature importance not provided")

        # Check for reasoning
        if 'reasoning' not in prediction_data:
            missing.append("Prediction reasoning not provided")
        elif len(prediction_data['reasoning']) < 50:
            missing.append("Prediction reasoning too brief")

        # Check for limitations acknowledgment
        if 'limitations' not in prediction_data:
            missing.append("Method limitations not acknowledged")

        # Check for data sources
        if 'data_sources' not in prediction_data:
            missing.append("Data sources not specified")

        # Check for assumptions
        if 'assumptions' not in prediction_data:
            missing.append("Method assumptions not listed")

        return len(missing) == 0, missing