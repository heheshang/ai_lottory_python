"""
Lottery draw model for storing historical lottery results
"""
from sqlalchemy import Column, Integer, Date, Boolean, ForeignKey, String, Numeric, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import BaseModel
from backend.app import db


class LotteryDraw(BaseModel):
    """Lottery draw model for storing historical lottery results"""
    __tablename__ = 'lottery_draws'

    lottery_type_id = Column(UUID(as_uuid=True), ForeignKey('lottery_types.id'), nullable=False)

    # Draw identification
    draw_date = Column(Date, nullable=False)
    draw_number = Column(Integer, nullable=False)

    # Winning numbers (structured for different lottery types)
    winning_numbers = Column(JSON, nullable=False)  # Example: {"main_numbers": [1, 5, 12, 23, 31], "bonus_numbers": [3, 8]}

    # Prize information
    prize_info = Column(JSON, default={})  # Example: {"tier_1": {"count": 1, "amount": 10000000}, "tier_2": {"count": 15, "amount": 50000}}
    jackpot_amount = Column(Numeric(15, 2))  # Up to 99 trillion
    winners_count = Column(JSON, default={})  # Example: {"tier_1": 1, "tier_2": 15, "tier_3": 200}

    # Additional draw-specific data
    additional_data = Column(JSON, default={})
    is_verified = Column(Boolean, default=True)

    # Relationships
    lottery_type = relationship('LotteryType', back_populates='lottery_draws')
    historical_analyses = relationship('HistoricalAnalysis', back_populates='lottery_draw', cascade='all, delete-orphan')

    # Performance indexes
    __table_args__ = (
        Index('idx_lottery_type_date', 'lottery_type_id', 'draw_date'),
        Index('idx_draw_number', 'draw_number'),
        UniqueConstraint('lottery_type_id', 'draw_number', name='uq_lottery_draw'),
    )

    def __repr__(self):
        return f'<LotteryDraw {self.lottery_type_id} - {self.draw_date}>'

    def get_total_winners(self):
        """Get total number of winners across all tiers"""
        if not self.winners_count:
            return 0
        return sum(self.winners_count.values())

    def get_main_numbers(self):
        """Get main winning numbers"""
        return self.winning_numbers.get('main_numbers', []) if self.winning_numbers else []

    def get_bonus_numbers(self):
        """Get bonus winning numbers"""
        return self.winning_numbers.get('bonus_numbers', []) if self.winning_numbers else []

    def get_all_numbers(self):
        """Get all winning numbers (main + bonus)"""
        main_nums = self.get_main_numbers()
        bonus_nums = self.get_bonus_numbers()
        return main_nums + bonus_nums

    def calculate_matches(self, user_numbers):
        """Calculate how many numbers match between user prediction and actual draw"""
        if not self.winning_numbers or not user_numbers:
            return {'main_matches': 0, 'bonus_matches': 0}

        user_main = user_numbers.get('main_numbers', [])
        user_bonus = user_numbers.get('bonus_numbers', [])

        actual_main = set(self.get_main_numbers())
        actual_bonus = set(self.get_bonus_numbers())

        main_matches = len(set(user_main) & actual_main)
        bonus_matches = len(set(user_bonus) & actual_bonus)

        return {'main_matches': main_matches, 'bonus_matches': bonus_matches}

    def to_dict_with_lottery_type(self):
        """Convert to dictionary including lottery type information"""
        result = self.to_dict()
        if self.lottery_type:
            result['lottery_type'] = {
                'name': self.lottery_type.name,
                'code': self.lottery_type.code,
                'number_ranges': self.lottery_type.number_ranges
            }
        return result