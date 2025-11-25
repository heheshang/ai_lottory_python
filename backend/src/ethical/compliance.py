"""
Ethical Compliance Manager

Core component that enforces constitutional requirements for the lottery prediction system.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
import json

logger = logging.getLogger(__name__)

class ComplianceLevel(Enum):
    """Compliance levels for different operations"""
    STRICT = "strict"      # Full constitutional compliance
    MODERATE = "moderate"  # Basic compliance with some flexibility
    LENIENT = "lenient"    # Minimal compliance (testing only)

class EthicalComplianceManager:
    """
    Main ethical compliance manager that enforces constitutional requirements
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the ethical compliance manager

        Args:
            config: Configuration dictionary with compliance settings
        """
        self.config = config or self._get_default_config()
        self.compliance_level = ComplianceLevel(self.config.get('compliance_level', 'strict'))

        # Constitutional requirements (these are enforced and cannot be changed)
        self.MAX_CONFIDENCE_SCORE = 0.85
        self.REQUIRED_DISCLAIMERS = [
            'lottery_randomness',
            'no_financial_advice',
            'responsible_gambling',
            'entertainment_only'
        ]

        # User protection settings
        self.DAILY_PREDICTION_LIMIT = self.config.get('daily_prediction_limit', 50)
        self.COOLING_OFF_PERIOD = self.config.get('cooling_off_period', 24)  # hours
        self.SELF_EXCLUSION_ENABLED = True

        # Initialize compliance tracking
        self.compliance_log = []
        self.violation_count = 0
        self.last_violation_check = datetime.utcnow()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default compliance configuration"""
        return {
            'compliance_level': 'strict',
            'daily_prediction_limit': 50,
            'cooling_off_period': 24,
            'enable_prediction_limiting': True,
            'enable_responsible_gambling': True,
            'enable_statistical_validation': True,
            'enable_transparency_requirements': True,
            'log_compliance_events': True
        }

    def validate_prediction_confidence(self, confidence_score: float) -> Tuple[float, bool, List[str]]:
        """
        Validate and cap prediction confidence scores according to constitutional requirements

        Args:
            confidence_score: Original confidence score (0.0 to 1.0)

        Returns:
            Tuple of (adjusted_confidence, is_compliant, violation_messages)
        """
        violations = []
        original_confidence = confidence_score

        # Constitutional requirement: Cap at 0.85
        if confidence_score > self.MAX_CONFIDENCE_SCORE:
            confidence_score = self.MAX_CONFIDENCE_SCORE
            violations.append(f"Confidence score {original_confidence} capped at constitutional maximum of {self.MAX_CONFIDENCE_SCORE}")

        # Ensure minimum confidence is reasonable
        if confidence_score < 0.0:
            confidence_score = 0.0
            violations.append(f"Invalid negative confidence score {original_confidence}, set to 0.0")

        is_compliant = len(violations) == 0

        # Log compliance event
        self._log_compliance_event(
            'confidence_validation',
            {
                'original_confidence': original_confidence,
                'adjusted_confidence': confidence_score,
                'is_compliant': is_compliant,
                'violations': violations
            }
        )

        return confidence_score, is_compliant, violations

    def validate_prediction_request(self, user_id: str, request_data: Dict[str, Any]) -> Tuple[bool, List[str], Dict[str, Any]]:
        """
        Validate a prediction request against ethical requirements

        Args:
            user_id: User identifier
            request_data: Prediction request data

        Returns:
            Tuple of (is_allowed, violation_messages, processed_data)
        """
        violations = []
        processed_data = request_data.copy()

        # 1. Check user prediction limits
        if self.config.get('enable_prediction_limiting', True):
            limit_violations = self._check_prediction_limits(user_id)
            violations.extend(limit_violations)

        # 2. Validate confidence score
        if 'confidence_score' in request_data:
            confidence = request_data['confidence_score']
            adjusted_confidence, is_compliant, confidence_violations = self.validate_prediction_confidence(confidence)
            processed_data['confidence_score'] = adjusted_confidence
            if confidence_violations:
                violations.extend(confidence_violations)

        # 3. Ensure confidence intervals are present
        if self.config.get('enable_transparency_requirements', True):
            if 'confidence_intervals' not in request_data:
                violations.append("Confidence intervals are required for transparency")
                processed_data['confidence_intervals'] = self._generate_default_confidence_intervals(request_data.get('predicted_numbers', {}))

        # 4. Check disclaimer acknowledgment
        if self.config.get('enable_responsible_gambling', True):
            if not request_data.get('disclaimer_acknowledged', False):
                violations.append("Responsible gambling disclaimer must be acknowledged")

        # 5. Validate method transparency
        if 'method' not in request_data:
            violations.append("Prediction method must be specified for transparency")
        else:
            processed_data['method'] = self._validate_prediction_method(request_data['method'])

        is_allowed = len(violations) == 0

        # Log compliance event
        self._log_compliance_event(
            'prediction_request_validation',
            {
                'user_id': user_id,
                'is_allowed': is_allowed,
                'violations': violations,
                'original_data': request_data,
                'processed_data': processed_data
            }
        )

        return is_allowed, violations, processed_data

    def _check_prediction_limits(self, user_id: str) -> List[str]:
        """Check if user has exceeded prediction limits"""
        violations = []

        # TODO: Implement actual user prediction counting from database
        # For now, return no violations (this would be implemented with actual user data)
        # prediction_count = get_user_prediction_count_today(user_id)
        # if prediction_count >= self.DAILY_PREDICTION_LIMIT:
        #     violations.append(f"Daily prediction limit of {self.DAILY_PREDICTION_LIMIT} exceeded")

        return violations

    def _generate_default_confidence_intervals(self, numbers: Dict[str, List[int]]) -> Dict[str, List[List[int]]]:
        """Generate default confidence intervals when not provided"""
        intervals = {}

        for num_type, num_list in numbers.items():
            if isinstance(num_list, list):
                if num_type == 'main_numbers':
                    intervals[num_type] = [[max(1, num - 3), min(35, num + 3)] for num in num_list]
                elif num_type == 'bonus_numbers':
                    intervals[num_type] = [[max(1, num - 2), min(12, num + 2)] for num in num_list]

        return intervals

    def _validate_prediction_method(self, method: str) -> str:
        """Validate prediction method and ensure it's approved"""
        approved_methods = [
            'weighted_frequency',
            'markov_chains',
            'ensemble_methods',
            'time_series_analysis'
        ]

        if method not in approved_methods:
            logger.warning(f"Unapproved prediction method: {method}")
            return 'weighted_frequency'  # Default to approved method

        return method

    def generate_required_disclaimers(self, context: Dict[str, Any] = None) -> List[Dict[str, str]]:
        """
        Generate all required constitutional disclaimers

        Args:
            context: Context information for disclaimer customization

        Returns:
            List of disclaimer dictionaries
        """
        disclaimers = [
            {
                'type': 'lottery_randomness',
                'title': 'Randomness Disclaimer',
                'text': 'Lottery outcomes are fundamentally random and unpredictable. Past results do not influence future outcomes.',
                'severity': 'high'
            },
            {
                'type': 'no_financial_advice',
                'title': 'Not Financial Advice',
                'text': 'This service provides entertainment and statistical analysis only. It is not financial or investment advice.',
                'severity': 'high'
            },
            {
                'type': 'responsible_gambling',
                'title': 'Responsible Gambling',
                'text': 'Please gamble responsibly. Set limits and know when to stop. If you need help, contact gambling support services.',
                'severity': 'high'
            },
            {
                'type': 'entertainment_only',
                'title': 'Entertainment Purpose',
                'text': 'This service is for entertainment purposes only. Do not spend more than you can afford to lose.',
                'severity': 'medium'
            },
            {
                'type': 'statistical_limitations',
                'title': 'Statistical Limitations',
                'text': f'Confidence scores are capped at {self.MAX_CONFIDENCE_SCORE} for ethical reasons. Statistical analysis has limited predictive power.',
                'severity': 'medium'
            }
        ]

        # Add user-specific disclaimers if context is provided
        if context:
            if context.get('high_frequency_user', False):
                disclaimers.append({
                    'type': 'usage_warning',
                    'title': 'Usage Warning',
                    'text': 'You have been using this service frequently. Please take breaks and gamble responsibly.',
                    'severity': 'medium'
                })

            if context.get('recent_losses', False):
                disclaimers.append({
                    'type': 'loss_acknowledgment',
                    'title': 'Loss Acknowledgment',
                    'text': 'Recent losses have been detected. Consider taking a break or setting stricter limits.',
                    'severity': 'high'
                })

        return disclaimers

    def check_user_protection_requirements(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check and enforce user protection requirements

        Args:
            user_data: User data including usage patterns

        Returns:
            Dictionary with protection recommendations and requirements
        """
        protection_actions = {
            'required_actions': [],
            'recommendations': [],
            'cooling_off_required': False,
            'self_exclusion_recommended': False
        }

        # Check daily usage
        if user_data.get('daily_predictions', 0) > self.DAILY_PREDICTION_LIMIT * 0.8:
            protection_actions['recommendations'].append('Approaching daily prediction limit')
            protection_actions['required_actions'].append('Show responsible gambling reminder')

        # Check for concerning patterns
        if user_data.get('consecutive_days_high_usage', 0) > 7:
            protection_actions['self_exclusion_recommended'] = True
            protection_actions['required_actions'].append('Require break acknowledgment')

        # Check financial indicators (if available)
        if user_data.get('rapid_predictions_per_hour', 0) > 20:
            protection_actions['cooling_off_required'] = True
            protection_actions['required_actions'].append('Implement cooling off period')

        return protection_actions

    def validate_statistical_significance(self, analysis_results: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate that statistical analysis meets constitutional requirements

        Args:
            analysis_results: Results from statistical analysis

        Returns:
            Tuple of (is_valid, violation_messages)
        """
        violations = []

        # Check for statistical significance reporting
        if 'statistical_significance' not in analysis_results:
            violations.append("Statistical significance must be reported")

        # Check for confidence intervals
        if 'confidence_intervals' not in analysis_results:
            violations.append("Confidence intervals must be provided")

        # Check for sample size
        if 'sample_size' not in analysis_results or analysis_results.get('sample_size', 0) < 50:
            violations.append("Insufficient sample size for reliable statistical analysis")

        # Check for method transparency
        if 'method' not in analysis_results:
            violations.append("Analysis method must be specified")

        # Validate significance threshold (should be reasonable)
        significance = analysis_results.get('statistical_significance', 1.0)
        if significance > 0.05:
            violations.append("Statistical significance threshold too high for reliable conclusions")

        is_valid = len(violations) == 0

        # Log compliance event
        self._log_compliance_event(
            'statistical_validation',
            {
                'is_valid': is_valid,
                'violations': violations,
                'analysis_results': analysis_results
            }
        )

        return is_valid, violations

    def _log_compliance_event(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """Log compliance events for auditing"""
        if self.config.get('log_compliance_events', True):
            log_entry = {
                'timestamp': datetime.utcnow().isoformat(),
                'event_type': event_type,
                'compliance_level': self.compliance_level.value,
                'data': event_data
            }

            self.compliance_log.append(log_entry)

            # Log to system logger
            logger.info(f"Compliance Event: {event_type} - {json.dumps(event_data, indent=2)}")

            # Keep only recent logs to prevent memory issues
            if len(self.compliance_log) > 10000:
                self.compliance_log = self.compliance_log[-5000:]

    def get_compliance_report(self) -> Dict[str, Any]:
        """
        Generate a comprehensive compliance report

        Returns:
            Dictionary with compliance statistics and summary
        """
        now = datetime.utcnow()
        recent_events = [
            event for event in self.compliance_log
            if datetime.fromisoformat(event['timestamp']) > now - timedelta(hours=24)
        ]

        violations = [event for event in recent_events if not event['data'].get('is_compliant', True)]

        return {
            'report_timestamp': now.isoformat(),
            'compliance_level': self.compliance_level.value,
            'constitutional_requirements': {
                'max_confidence_cap': self.MAX_CONFIDENCE_SCORE,
                'required_disclaimers': self.REQUIRED_DISCLAIMERS
            },
            'statistics': {
                'total_events_24h': len(recent_events),
                'violations_24h': len(violations),
                'compliance_rate': 1.0 - (len(violations) / max(len(recent_events), 1)),
                'most_common_violations': self._get_most_common_violations(violations)
            },
            'user_protection': {
                'daily_prediction_limit': self.DAILY_PREDICTION_LIMIT,
                'cooling_off_period_hours': self.COOLING_OFF_PERIOD,
                'self_exclusion_enabled': self.SELF_EXCLUSION_ENABLED
            },
            'recent_violations': violations[-10:]  # Last 10 violations
        }

    def _get_most_common_violations(self, violations: List[Dict]) -> List[str]:
        """Get most common violation types"""
        if not violations:
            return []

        violation_counts = {}
        for violation in violations:
            for message in violation['data'].get('violations', []):
                violation_type = message.split(':')[0] if ':' in message else message
                violation_counts[violation_type] = violation_counts.get(violation_type, 0) + 1

        return sorted(violation_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    def audit_user_activity(self, user_id: str, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Audit user activity for compliance issues

        Args:
            user_id: User identifier
            activity_data: User activity data

        Returns:
            Dictionary with audit results and recommendations
        """
        audit_results = {
            'user_id': user_id,
            'audit_timestamp': datetime.utcnow().isoformat(),
            'compliance_status': 'compliant',
            'violations': [],
            'recommendations': [],
            'protection_actions': []
        }

        # Check for excessive usage patterns
        daily_predictions = activity_data.get('daily_predictions', 0)
        if daily_predictions > self.DAILY_PREDICTION_LIMIT:
            audit_results['violations'].append(f"Exceeded daily prediction limit: {daily_predictions}")
            audit_results['compliance_status'] = 'non_compliant'

        # Check for rapid fire predictions
        rapid_predictions = activity_data.get('predictions_per_hour', 0)
        if rapid_predictions > 20:
            audit_results['violations'].append(f"Excessive prediction rate: {rapid_predictions} per hour")
            audit_results['compliance_status'] = 'non_compliant'

        # Generate recommendations
        if daily_predictions > self.DAILY_PREDICTION_LIMIT * 0.7:
            audit_results['recommendations'].append("Consider reducing prediction frequency")

        # Check protection actions
        protection_actions = self.check_user_protection_requirements(activity_data)
        audit_results['protection_actions'] = protection_actions

        # Log audit
        self._log_compliance_event('user_audit', audit_results)

        return audit_results