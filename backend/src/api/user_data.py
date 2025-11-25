"""
User data API endpoints
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from functools import wraps
from .auth import token_required

# Import models when they're available
# from backend.database import db
# from src.models.user_profile import User
# from src.models.user_session import UserSession
# from src.models.user_prediction import UserPrediction

user_data_bp = Blueprint('user_data', __name__, url_prefix='/api/user')

def validate_user_preferences(preferences):
    """Validate user preferences"""
    allowed_keys = [
        'preferred_analysis_methods', 'default_confidence_threshold',
        'notifications_enabled', 'theme', 'risk_tolerance', 'max_predictions_daily'
    ]

    for key in preferences:
        if key not in allowed_keys:
            return False, f"Invalid preference key: {key}"

    # Validate specific values
    if 'default_confidence_threshold' in preferences:
        threshold = preferences['default_confidence_threshold']
        if not (0.0 <= threshold <= 1.0):
            return False, "Confidence threshold must be between 0.0 and 1.0"

    if 'risk_tolerance' in preferences:
        risk = preferences['risk_tolerance']
        if risk not in ['conservative', 'moderate', 'aggressive']:
            return False, "Invalid risk tolerance value"

    if 'max_predictions_daily' in preferences:
        max_pred = preferences['max_predictions_daily']
        if not (1 <= max_pred <= 1000):
            return False, "Max predictions daily must be between 1 and 1000"

    return True, "Preferences are valid"

@user_data_bp.route('/profile', methods=['GET'])
@token_required
def get_user_profile():
    """Get user profile information"""
    try:
        # TODO: Get user from JWT token and database
        # user_id = get_user_id_from_token()
        # user = User.query.get(user_id)
        # if not user:
        #     return jsonify({'error': 'User not found'}), 404

        # For now, return placeholder data
        user_profile = {
            'id': 'placeholder-user-id',
            'username': 'demo_user',
            'email': 'demo@example.com',
            'created_at': '2025-01-01T00:00:00',
            'last_active': '2025-01-20T15:30:00',
            'preferences': {
                'preferred_analysis_methods': ['weighted_frequency'],
                'default_confidence_threshold': 0.7,
                'notifications_enabled': True,
                'theme': 'light',
                'risk_tolerance': 'moderate',
                'max_predictions_daily': 50
            },
            'responsible_gambling_acknowledged': True,
            'is_active': True
        }

        return jsonify({
            'profile': user_profile
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get user profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/profile', methods=['PUT'])
@token_required
def update_user_profile():
    """Update user profile information"""
    try:
        data = request.get_json()

        # Validate allowed update fields
        allowed_fields = ['preferences']
        for field in data:
            if field not in allowed_fields:
                return jsonify({'error': f'Cannot update field: {field}'}), 400

        # Validate preferences if provided
        if 'preferences' in data:
            is_valid, message = validate_user_preferences(data['preferences'])
            if not is_valid:
                return jsonify({'error': message}), 400

        # TODO: Update user in database
        # user_id = get_user_id_from_token()
        # user = User.query.get(user_id)
        # if user:
        #     if 'preferences' in data:
        #         user.preferences = {**user.preferences, **data['preferences']}
        #     db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'updated_fields': list(data.keys())
        }), 200

    except Exception as e:
        current_app.logger.error(f"Update user profile error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/sessions', methods=['GET'])
@token_required
def get_user_sessions():
    """Get user session history"""
    try:
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))

        # TODO: Get user sessions from database
        # user_id = get_user_id_from_token()
        # sessions = UserSession.query.filter_by(user_id=user_id).order_by(
        #     UserSession.session_start.desc()
        # ).offset(offset).limit(limit).all()

        # For now, return placeholder data
        sessions = [
            {
                'id': 'session-id-1',
                'session_start': '2025-01-20T10:00:00',
                'last_activity': '2025-01-20T15:30:00',
                'predictions_count': 15,
                'ip_address': '192.168.1.100',
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        ]

        return jsonify({
            'sessions': sessions,
            'count': len(sessions),
            'limit': limit,
            'offset': offset
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400
    except Exception as e:
        current_app.logger.error(f"Get user sessions error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/predictions', methods=['GET'])
@token_required
def get_user_predictions():
    """Get user's prediction history"""
    try:
        lottery_type_id = request.args.get('lottery_type_id')
        bookmarked = request.args.get('bookmarked', 'false').lower() == 'true'
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        # TODO: Get user predictions from database
        # user_id = get_user_id_from_token()
        # query = UserPrediction.query.filter_by(user_id=user_id)
        #
        # if lottery_type_id:
        #     query = query.filter_by(lottery_type_id=lottery_type_id)
        # if bookmarked:
        #     query = query.filter_by(is_bookmarked=True)
        #
        # predictions = query.order_by(UserPrediction.created_at.desc()).offset(offset).limit(limit).all()

        # For now, return placeholder data
        predictions = [
            {
                'id': 'prediction-id-1',
                'lottery_type': '大乐透',
                'method': 'weighted_frequency',
                'predicted_numbers': {'main_numbers': [1, 5, 12, 23, 31], 'bonus_numbers': [3, 8]},
                'confidence_score': 0.75,
                'created_at': '2025-01-20T10:30:00',
                'actual_accuracy': None,
                'is_bookmarked': False,
                'user_feedback': None
            }
        ]

        return jsonify({
            'predictions': predictions,
            'count': len(predictions),
            'limit': limit,
            'offset': offset,
            'filters': {
                'lottery_type_id': lottery_type_id,
                'bookmarked': bookmarked
            }
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400
    except Exception as e:
        current_app.logger.error(f"Get user predictions error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/statistics', methods=['GET'])
@token_required
def get_user_statistics():
    """Get user statistics and analytics"""
    try:
        # TODO: Calculate user statistics from database
        # user_id = get_user_id_from_token()
        # total_predictions = UserPrediction.query.filter_by(user_id=user_id).count()
        # bookmarked_predictions = UserPrediction.query.filter_by(user_id=user_id, is_bookmarked=True).count()
        #
        # Calculate prediction accuracy for predictions with actual results
        # predictions_with_results = UserPrediction.query.filter(
        #     UserPrediction.user_id == user_id,
        #     UserPrediction.actual_accuracy.isnot(None)
        # ).all()
        # average_accuracy = sum(p.actual_accuracy for p in predictions_with_results) / len(predictions_with_results) if predictions_with_results else 0

        # For now, return placeholder data
        statistics = {
            'total_predictions': 145,
            'bookmarked_predictions': 23,
            'average_confidence': 0.68,
            'predictions_with_accuracy': 12,
            'average_accuracy': 0.15,
            'most_used_method': 'weighted_frequency',
            'prediction_frequency': {
                'daily_average': 4.8,
                'most_active_day': 'Tuesday',
                'least_active_day': 'Sunday'
            },
            'accuracy_by_method': {
                'weighted_frequency': 0.14,
                'markov_chains': 0.12,
                'ensemble_methods': 0.18
            },
            'recent_activity': {
                'last_prediction': '2025-01-20T15:30:00',
                'predictions_this_week': 28,
                'predictions_this_month': 124
            }
        }

        return jsonify({
            'statistics': statistics,
            'disclaimer': 'Accuracy statistics are based on historical data and do not guarantee future performance.'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get user statistics error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/activity', methods=['GET'])
@token_required
def get_user_activity():
    """Get user activity timeline"""
    try:
        activity_type = request.args.get('type', 'all')  # all, predictions, sessions, feedback
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 100))

        if activity_type not in ['all', 'predictions', 'sessions', 'feedback']:
            return jsonify({'error': 'Invalid activity type'}), 400

        # TODO: Get user activity from database
        # For now, return placeholder data
        activities = [
            {
                'id': 'activity-1',
                'type': 'prediction',
                'description': 'Generated prediction using weighted frequency method',
                'timestamp': '2025-01-20T15:30:00',
                'details': {
                    'method': 'weighted_frequency',
                    'confidence_score': 0.75,
                    'numbers': [1, 5, 12, 23, 31]
                }
            },
            {
                'id': 'activity-2',
                'type': 'bookmark',
                'description': 'Bookmarked prediction',
                'timestamp': '2025-01-20T14:15:00',
                'details': {
                    'prediction_id': 'prediction-id-1'
                }
            },
            {
                'id': 'activity-3',
                'type': 'feedback',
                'description': 'Provided feedback on prediction',
                'timestamp': '2025-01-20T12:00:00',
                'details': {
                    'rating': 4,
                    'helpfulness': 'moderately helpful'
                }
            }
        ]

        # Filter by type if specified
        if activity_type != 'all':
            activities = [a for a in activities if a['type'] == activity_type]

        return jsonify({
            'activities': activities[:limit],
            'count': len(activities[:limit]),
            'filters': {
                'type': activity_type,
                'start_date': start_date,
                'end_date': end_date
            }
        }), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter: {str(e)}'}), 400
    except Exception as e:
        current_app.logger.error(f"Get user activity error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/export', methods=['GET'])
@token_required
def export_user_data():
    """Export user data in JSON or CSV format"""
    try:
        format_type = request.args.get('format', 'json')
        data_type = request.args.get('type', 'all')  # all, predictions, profile, statistics

        if format_type not in ['json', 'csv']:
            return jsonify({'error': 'Invalid format. Supported: json, csv'}), 400

        if data_type not in ['all', 'predictions', 'profile', 'statistics']:
            return jsonify({'error': 'Invalid data type'}), 400

        # TODO: Export actual user data from database
        export_data = {
            'message': 'Data export functionality will be implemented',
            'format': format_type,
            'type': data_type,
            'export_date': datetime.utcnow().isoformat(),
            'user_id': 'placeholder-user-id'
        }

        return jsonify(export_data), 200

    except Exception as e:
        current_app.logger.error(f"Export user data error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@user_data_bp.route('/delete-account', methods=['POST'])
@token_required
def delete_user_account():
    """Request account deletion"""
    try:
        data = request.get_json()
        confirmation = data.get('confirmation', '').lower()

        if confirmation != 'delete my account':
            return jsonify({'error': 'Invalid confirmation. Please type "delete my account"'}), 400

        # TODO: Implement account deletion logic
        # This should be a soft delete with data retention policy
        # user_id = get_user_id_from_token()
        # user = User.query.get(user_id)
        # if user:
        #     user.is_active = False
        #     user.deletion_requested_at = datetime.utcnow()
        #     db.session.commit()

        return jsonify({
            'message': 'Account deletion request received. Your account will be deactivated within 30 days.',
            'recovery_period': '30 days'
        }), 200

    except Exception as e:
        current_app.logger.error(f"Delete account error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500