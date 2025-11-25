"""
Ethical compliance monitoring and reporting system
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
import json
from dataclasses import dataclass
import statistics

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplianceStatus(Enum):
    """Compliance status levels"""
    COMPLIANT = "compliant"
    WARNING = "warning"
    VIOLATION = "violation"
    CRITICAL = "critical"

@dataclass
class ComplianceAlert:
    """Compliance alert data structure"""
    id: str
    timestamp: datetime
    severity: AlertSeverity
    status: ComplianceStatus
    title: str
    description: str
    user_id: Optional[str]
    data: Dict[str, Any]
    resolved: bool = False
    resolved_at: Optional[datetime] = None

@dataclass
class ComplianceMetrics:
    """Compliance metrics data structure"""
    timestamp: datetime
    total_predictions: int
    compliant_predictions: int
    violations_count: int
    average_confidence_score: float
    disclaimer_acknowledgment_rate: float
    user_protection_interventions: int
    statistical_significance_rate: float

class EthicalMonitor:
    """
    Monitors ethical compliance across the lottery prediction system
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize the ethical monitor

        Args:
            config: Configuration dictionary
        """
        self.config = config or self._get_default_config()
        self.alerts = []
        self.metrics_history = []
        self.active_alerts = {}
        self.alert_callbacks = {}

        # Monitoring thresholds
        self.violation_rate_threshold = self.config.get('violation_rate_threshold', 0.05)  # 5%
        self.user_protection_threshold = self.config.get('user_protection_threshold', 10)  # interventions per hour
        self.confidence_violation_threshold = self.config.get('confidence_violation_threshold', 0.1)  # 10%

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default monitoring configuration"""
        return {
            'violation_rate_threshold': 0.05,
            'user_protection_threshold': 10,
            'confidence_violation_threshold': 0.1,
            'alert_retention_days': 30,
            'metrics_retention_days': 90,
            'enable_real_time_alerts': True,
            'enable_user_monitoring': True,
            'enable_system_monitoring': True
        }

    def monitor_prediction_request(self, prediction_data: Dict[str, Any], compliance_result: Dict[str, Any]) -> Optional[ComplianceAlert]:
        """
        Monitor a prediction request for compliance issues

        Args:
            prediction_data: Prediction request data
            compliance_result: Result from compliance validation

        Returns:
            ComplianceAlert if issues detected, None otherwise
        """
        alerts = []

        user_id = prediction_data.get('user_id')
        is_compliant = compliance_result.get('is_allowed', True)
        violations = compliance_result.get('violations', [])

        # Check for confidence violations
        if 'confidence_score' in prediction_data:
            confidence = prediction_data['confidence_score']
            if confidence > 0.85:  # Constitutional limit
                alert = self._create_alert(
                    AlertSeverity.HIGH,
                    ComplianceStatus.VIOLATION,
                    "Confidence Score Violation",
                    f"Prediction confidence score {confidence} exceeds constitutional limit of 0.85",
                    user_id,
                    {'confidence_score': confidence, 'prediction_data': prediction_data}
                )
                alerts.append(alert)

        # Check for missing disclaimers
        if not prediction_data.get('disclaimer_acknowledged', False):
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "Missing Disclaimer Acknowledgment",
                "User has not acknowledged responsible gambling disclaimer",
                user_id,
                {'prediction_data': prediction_data}
            )
            alerts.append(alert)

        # Check for multiple violations
        if len(violations) > 2:
            alert = self._create_alert(
                AlertSeverity.HIGH,
                ComplianceStatus.VIOLATION,
                "Multiple Compliance Violations",
                f"Prediction request has {len(violations)} compliance violations",
                user_id,
                {'violations': violations, 'prediction_data': prediction_data}
            )
            alerts.append(alert)

        # Store alerts and return the most critical one
        if alerts:
            primary_alert = max(alerts, key=lambda x: self._get_severity_weight(x.severity))
            self.add_alert(primary_alert)
            return primary_alert

        return None

    def monitor_user_activity(self, user_id: str, activity_data: Dict[str, Any]) -> List[ComplianceAlert]:
        """
        Monitor user activity for concerning patterns

        Args:
            user_id: User identifier
            activity_data: User activity data

        Returns:
            List of compliance alerts generated
        """
        alerts = []

        if not self.config.get('enable_user_monitoring', True):
            return alerts

        # Check for excessive prediction frequency
        hourly_predictions = activity_data.get('hourly_predictions', 0)
        if hourly_predictions > 20:
            alert = self._create_alert(
                AlertSeverity.HIGH,
                ComplianceStatus.WARNING,
                "Excessive Prediction Frequency",
                f"User has made {hourly_predictions} predictions in the last hour",
                user_id,
                {'hourly_predictions': hourly_predictions, 'activity_data': activity_data}
            )
            alerts.append(alert)

        # Check for consecutive days of high usage
        consecutive_high_usage = activity_data.get('consecutive_high_usage_days', 0)
        if consecutive_high_usage > 7:
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "Extended High Usage Pattern",
                f"User has shown high usage for {consecutive_high_usage} consecutive days",
                user_id,
                {'consecutive_days': consecutive_high_usage, 'activity_data': activity_data}
            )
            alerts.append(alert)

        # Check for late-night usage pattern
        late_night_predictions = activity_data.get('late_night_predictions', 0)
        if late_night_predictions > 5:
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "Late Night Usage Pattern",
                f"User has made {late_night_predictions} predictions during late night hours",
                user_id,
                {'late_night_predictions': late_night_predictions, 'activity_data': activity_data}
            )
            alerts.append(alert)

        # Check for rapid fire predictions
        rapid_predictions = activity_data.get('rapid_predictions_5min', 0)
        if rapid_predictions > 10:
            alert = self._create_alert(
                AlertSeverity.HIGH,
                ComplianceStatus.WARNING,
                "Rapid Fire Predictions",
                f"User has made {rapid_predictions} predictions in 5 minutes",
                user_id,
                {'rapid_predictions': rapid_predictions, 'activity_data': activity_data}
            )
            alerts.append(alert)

        # Store alerts
        for alert in alerts:
            self.add_alert(alert)

        return alerts

    def monitor_system_metrics(self, metrics: ComplianceMetrics) -> List[ComplianceAlert]:
        """
        Monitor system-wide compliance metrics

        Args:
            metrics: Current compliance metrics

        Returns:
            List of compliance alerts generated
        """
        alerts = []

        if not self.config.get('enable_system_monitoring', True):
            return alerts

        self.metrics_history.append(metrics)

        # Calculate compliance rate
        if metrics.total_predictions > 0:
            compliance_rate = metrics.compliant_predictions / metrics.total_predictions
            if compliance_rate < (1.0 - self.violation_rate_threshold):
                alert = self._create_alert(
                    AlertSeverity.HIGH,
                    ComplianceStatus.VIOLATION,
                    "Low Compliance Rate",
                    f"System compliance rate {compliance_rate:.2%} below threshold {1.0 - self.violation_rate_threshold:.2%}",
                    None,
                    {'compliance_rate': compliance_rate, 'metrics': metrics.__dict__}
                )
                alerts.append(alert)

        # Check user protection interventions
        if metrics.user_protection_interventions > self.user_protection_threshold:
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "High User Protection Interventions",
                f"System has performed {metrics.user_protection_interventions} user protection interventions",
                None,
                {'interventions': metrics.user_protection_interventions, 'metrics': metrics.__dict__}
            )
            alerts.append(alert)

        # Check disclaimer acknowledgment rate
        if metrics.disclaimer_acknowledgment_rate < 0.9:
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "Low Disclaimer Acknowledgment Rate",
                f"Disclaimer acknowledgment rate {metrics.disclaimer_acknowledgment_rate:.2%} is below 90%",
                None,
                {'acknowledgment_rate': metrics.disclaimer_acknowledgment_rate, 'metrics': metrics.__dict__}
            )
            alerts.append(alert)

        # Check statistical significance
        if metrics.statistical_significance_rate < 0.7:
            alert = self._create_alert(
                AlertSeverity.MEDIUM,
                ComplianceStatus.WARNING,
                "Low Statistical Significance Rate",
                f"Statistical significance rate {metrics.statistical_significance_rate:.2%} below 70%",
                None,
                {'significance_rate': metrics.statistical_significance_rate, 'metrics': metrics.__dict__}
            )
            alerts.append(alert)

        # Store alerts
        for alert in alerts:
            self.add_alert(alert)

        return alerts

    def check_alert_patterns(self) -> List[ComplianceAlert]:
        """
        Check for patterns in existing alerts that may indicate systemic issues

        Returns:
            List of pattern-based alerts
        """
        pattern_alerts = []
        now = datetime.utcnow()
        recent_hours = 24

        # Get recent alerts
        recent_alerts = [
            alert for alert in self.alerts
            if (now - alert.timestamp).total_seconds() < (recent_hours * 3600)
        ]

        # Check for high volume of confidence violations
        confidence_violations = [
            alert for alert in recent_alerts
            if 'Confidence Score Violation' in alert.title
        ]

        if len(confidence_violations) > 50:  # More than 50 confidence violations in 24 hours
            alert = self._create_alert(
                AlertSeverity.HIGH,
                ComplianceStatus.CRITICAL,
                "High Volume of Confidence Violations",
                f"System has generated {len(confidence_violations)} confidence violations in the last 24 hours",
                None,
                {'violation_count': len(confidence_violations), 'timeframe': '24 hours'}
            )
            pattern_alerts.append(alert)

        # Check for repeated violations by same user
        user_violations = {}
        for alert in recent_alerts:
            if alert.user_id and alert.status != ComplianceStatus.COMPLIANT:
                user_violations[alert.user_id] = user_violations.get(alert.user_id, 0) + 1

        problem_users = {
            user_id: count for user_id, count in user_violations.items()
            if count > 5  # More than 5 violations in 24 hours
        }

        if problem_users:
            alert = self._create_alert(
                AlertSeverity.HIGH,
                ComplianceStatus.WARNING,
                "Multiple Users with Repeated Violations",
                f"{len(problem_users)} users have more than 5 compliance violations in 24 hours",
                None,
                {'problem_users': problem_users, 'violation_counts': user_violations}
            )
            pattern_alerts.append(alert)

        # Store pattern alerts
        for alert in pattern_alerts:
            self.add_alert(alert)

        return pattern_alerts

    def generate_compliance_report(self, time_period_hours: int = 24) -> Dict[str, Any]:
        """
        Generate a comprehensive compliance report

        Args:
            time_period_hours: Time period for the report (in hours)

        Returns:
            Dictionary with compliance report data
        """
        now = datetime.utcnow()
        cutoff_time = now - timedelta(hours=time_period_hours)

        # Filter alerts within time period
        period_alerts = [
            alert for alert in self.alerts
            if alert.timestamp >= cutoff_time
        ]

        # Filter metrics within time period
        period_metrics = [
            metrics for metrics in self.metrics_history
            if metrics.timestamp >= cutoff_time
        ]

        # Calculate statistics
        total_alerts = len(period_alerts)
        alerts_by_severity = {}
        alerts_by_status = {}

        for alert in period_alerts:
            alerts_by_severity[alert.severity.value] = alerts_by_severity.get(alert.severity.value, 0) + 1
            alerts_by_status[alert.status.value] = alerts_by_status.get(alert.status.value, 0) + 1

        # Calculate compliance rate if we have metrics
        compliance_rate = 0.0
        if period_metrics:
            total_predictions = sum(m.total_predictions for m in period_metrics)
            compliant_predictions = sum(m.compliant_predictions for m in period_metrics)
            if total_predictions > 0:
                compliance_rate = compliant_predictions / total_predictions

        # Identify top issues
        issue_counts = {}
        for alert in period_alerts:
            issue_counts[alert.title] = issue_counts.get(alert.title, 0) + 1

        top_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            'report_timestamp': now.isoformat(),
            'time_period_hours': time_period_hours,
            'summary': {
                'total_alerts': total_alerts,
                'active_alerts': len(self.get_active_alerts()),
                'compliance_rate': compliance_rate,
                'most_common_severity': max(alerts_by_severity.items(), key=lambda x: x[1])[0] if alerts_by_severity else None
            },
            'alerts_by_severity': alerts_by_severity,
            'alerts_by_status': alerts_by_status,
            'top_issues': top_issues,
            'metrics_summary': self._calculate_metrics_summary(period_metrics),
            'recommendations': self._generate_recommendations(period_alerts, period_metrics)
        }

    def _calculate_metrics_summary(self, metrics: List[ComplianceMetrics]) -> Dict[str, Any]:
        """Calculate summary statistics from metrics"""
        if not metrics:
            return {}

        return {
            'average_confidence_score': statistics.mean([m.average_confidence_score for m in metrics]),
            'total_predictions': sum(m.total_predictions for m in metrics),
            'compliance_rate': sum(m.compliant_predictions for m in metrics) / max(sum(m.total_predictions for m in metrics), 1),
            'average_disclaimer_rate': statistics.mean([m.disclaimer_acknowledgment_rate for m in metrics]),
            'total_interventions': sum(m.user_protection_interventions for m in metrics)
        }

    def _generate_recommendations(self, alerts: List[ComplianceAlert], metrics: List[ComplianceMetrics]) -> List[str]:
        """Generate recommendations based on alerts and metrics"""
        recommendations = []

        # Analyze alerts for recommendations
        confidence_violations = len([a for a in alerts if 'Confidence Score' in a.title])
        if confidence_violations > 10:
            recommendations.append("Review confidence score calculation logic - high number of violations detected")

        disclaimer_issues = len([a for a in alerts if 'Disclaimer' in a.title])
        if disclaimer_issues > 5:
            recommendations.append("Improve disclaimer visibility and acknowledgment process")

        user_activity_issues = len([a for a in alerts if 'Usage' in a.title or 'Frequency' in a.title])
        if user_activity_issues > 3:
            recommendations.append("Implement stronger user protection measures and usage limits")

        # Analyze metrics for recommendations
        if metrics:
            avg_compliance = sum(m.compliant_predictions for m in metrics) / max(sum(m.total_predictions for m in metrics), 1)
            if avg_compliance < 0.95:
                recommendations.append("Overall compliance rate below 95% - review compliance enforcement")

            avg_disclaimer_rate = statistics.mean([m.disclaimer_acknowledgment_rate for m in metrics])
            if avg_disclaimer_rate < 0.9:
                recommendations.append("Disclaimer acknowledgment rate below 90% - improve user education")

        return recommendations

    def _create_alert(self, severity: AlertSeverity, status: ComplianceStatus, title: str, description: str, user_id: Optional[str], data: Dict[str, Any]) -> ComplianceAlert:
        """Create a compliance alert"""
        import uuid
        return ComplianceAlert(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            severity=severity,
            status=status,
            title=title,
            description=description,
            user_id=user_id,
            data=data
        )

    def _get_severity_weight(self, severity: AlertSeverity) -> int:
        """Get numeric weight for alert severity"""
        weights = {
            AlertSeverity.LOW: 1,
            AlertSeverity.MEDIUM: 2,
            AlertSeverity.HIGH: 3,
            AlertSeverity.CRITICAL: 4
        }
        return weights.get(severity, 0)

    def add_alert(self, alert: ComplianceAlert) -> None:
        """Add a compliance alert to the monitoring system"""
        self.alerts.append(alert)

        if not alert.resolved:
            self.active_alerts[alert.id] = alert

        # Trigger callbacks if configured
        if alert.id in self.alert_callbacks:
            try:
                self.alert_callbacks[alert.id](alert)
            except Exception as e:
                logger.error(f"Error executing alert callback for {alert.id}: {str(e)}")

        # Clean old alerts and metrics
        self._cleanup_old_data()

    def resolve_alert(self, alert_id: str, resolution_note: str = "") -> bool:
        """
        Resolve a compliance alert

        Args:
            alert_id: Alert identifier
            resolution_note: Optional resolution note

        Returns:
            True if alert was found and resolved, False otherwise
        """
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolved = True
            alert.resolved_at = datetime.utcnow()
            alert.resolution_note = resolution_note
            del self.active_alerts[alert_id]
            return True

        # Check if alert exists but is already resolved
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.utcnow()
                alert.resolution_note = resolution_note
                return True

        return False

    def get_active_alerts(self) -> List[ComplianceAlert]:
        """Get all currently active alerts"""
        return list(self.active_alerts.values())

    def get_alerts_by_user(self, user_id: str) -> List[ComplianceAlert]:
        """Get all alerts for a specific user"""
        return [alert for alert in self.alerts if alert.user_id == user_id]

    def get_alerts_by_severity(self, severity: AlertSeverity) -> List[ComplianceAlert]:
        """Get all alerts of a specific severity level"""
        return [alert for alert in self.alerts if alert.severity == severity]

    def register_alert_callback(self, alert_id: str, callback: Callable[[ComplianceAlert], None]) -> None:
        """
        Register a callback function to be executed when an alert is generated

        Args:
            alert_id: Alert ID to watch for
            callback: Callback function to execute
        """
        self.alert_callbacks[alert_id] = callback

    def _cleanup_old_data(self) -> None:
        """Clean up old alerts and metrics to prevent memory issues"""
        cutoff_days = self.config.get('alert_retention_days', 30)
        metrics_cutoff_days = self.config.get('metrics_retention_days', 90)

        now = datetime.utcnow()
        alert_cutoff = now - timedelta(days=cutoff_days)
        metrics_cutoff = now - timedelta(days=metrics_cutoff_days)

        # Clean old alerts
        self.alerts = [alert for alert in self.alerts if alert.timestamp > alert_cutoff]

        # Clean old metrics
        self.metrics_history = [metrics for metrics in self.metrics_history if metrics.timestamp > metrics_cutoff]

        # Clean resolved active alerts
        self.active_alerts = {
            alert_id: alert for alert_id, alert in self.active_alerts.items()
            if not alert.resolved
        }