"""
Lottery type model for defining different lottery games
"""
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSON
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


class LotteryType(BaseModel):
    """Lottery type model for defining different lottery games"""
    __tablename__ = 'lottery_types'

    name = Column(String(100), nullable=False)  # e.g., "大乐透"
    code = Column(String(20), unique=True, nullable=False)  # e.g., "SUPER_LOTTERY"

    # Number configuration
    number_ranges = Column(JSON, nullable=False)  # Example: {"main_numbers": {"min": 1, "max": 35, "count": 5}, "bonus_numbers": {"min": 1, "max": 12, "count": 2}}

    # Draw format and rules
    draw_format = Column(JSON, nullable=False)  # Example: {"draw_frequency": "weekly", "draw_days": ["tue", "fri"], "draw_time": "20:30", "timezone": "Asia/Shanghai"}

    # Metadata
    country = Column(String(50), default='CN')
    currency = Column(String(3), default='CNY')
    is_active = Column(Boolean, default=True)

    # Relationships
    lottery_draws = relationship('LotteryDraw', back_populates='lottery_type', cascade='all, delete-orphan')
    analysis_methods = relationship('AnalysisMethod', secondary='lottery_type_analysis_methods', back_populates='lottery_types')
    user_predictions = relationship('UserPrediction', back_populates='lottery_type')

    def __repr__(self):
        return f'<LotteryType {self.name}>'

    def validate_numbers(self, numbers):
        """Validate lottery numbers against lottery type rules"""
        if not self.number_ranges:
            return False, "Number ranges not defined"

        ranges = self.number_ranges
        main_numbers = numbers.get('main_numbers', [])
        bonus_numbers = numbers.get('bonus_numbers', [])

        # Check count
        if len(main_numbers) != ranges.get('main_numbers', {}).get('count', 0):
            return False, f"Expected {ranges.get('main_numbers', {}).get('count', 0)} main numbers, got {len(main_numbers)}"

        bonus_count = ranges.get('bonus_numbers', {}).get('count', 0)
        if bonus_count > 0 and len(bonus_numbers) != bonus_count:
            return False, f"Expected {bonus_count} bonus numbers, got {len(bonus_numbers)}"

        # Check ranges
        main_min, main_max = ranges.get('main_numbers', {}).get('min', 1), ranges.get('main_numbers', {}).get('max', 35)
        bonus_min, bonus_max = ranges.get('bonus_numbers', {}).get('min', 1), ranges.get('bonus_numbers', {}).get('max', 12)

        if not all(main_min <= num <= main_max for num in main_numbers):
            return False, f"Main numbers must be between {main_min} and {main_max}"

        if bonus_count > 0 and not all(bonus_min <= num <= bonus_max for num in bonus_numbers):
            return False, f"Bonus numbers must be between {bonus_min} and {bonus_max}"

        # Check for duplicates
        if len(main_numbers) != len(set(main_numbers)):
            return False, "Main numbers must be unique"

        if bonus_count > 0 and len(bonus_numbers) != len(set(bonus_numbers)):
            return False, "Bonus numbers must be unique"

        return True, "Numbers are valid"

    def get_next_draw_date(self, current_date=None):
        """Calculate next draw date based on draw format"""
        from datetime import datetime, timedelta
        import calendar

        if current_date is None:
            current_date = datetime.utcnow()

        if not self.draw_format or not self.draw_format.get('draw_days'):
            return None

        draw_days = self.draw_format.get('draw_days', [])
        draw_time = self.draw_format.get('draw_time', '20:30')
        timezone = self.draw_format.get('timezone', 'UTC')

        # Map day names to weekday numbers (0=Monday, 6=Sunday)
        day_map = {
            'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3,
            'fri': 4, 'sat': 5, 'sun': 6
        }

        draw_weekdays = [day_map.get(day.lower()[:3]) for day in draw_days if day.lower()[:3] in day_map]

        if not draw_weekdays:
            return None

        current_weekday = current_date.weekday()
        days_ahead = []

        for draw_day in draw_weekdays:
            days_ahead = (draw_day - current_weekday) % 7
            if days_ahead == 0:  # Today is a draw day
                # Check if current time is past draw time
                draw_datetime = current_date.replace(
                    hour=int(draw_time.split(':')[0]),
                    minute=int(draw_time.split(':')[1]),
                    second=0, microsecond=0
                )
                if current_date >= draw_datetime:
                    days_ahead = 7  # Next week's draw
            break

        next_draw_date = current_date + timedelta(days=days_ahead)
        return next_draw_date.replace(
            hour=int(draw_time.split(':')[0]),
            minute=int(draw_time.split(':')[1]),
            second=0, microsecond=0
        )