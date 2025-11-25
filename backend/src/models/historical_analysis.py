"""
Historical analysis model for storing analysis results of lottery draws
"""
from sqlalchemy import Column, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from .base import BaseModel
from backend.app import db


class HistoricalAnalysis(BaseModel):
    """Historical analysis model for storing analysis results of lottery draws"""
    __tablename__ = 'historical_analyses'

    lottery_draw_id = Column(UUID(as_uuid=True), ForeignKey('lottery_draws.id'), nullable=False)

    # Analysis results
    hot_numbers = Column(JSON, default=[])  # Frequently drawn numbers
    cold_numbers = Column(JSON, default=[])  # Infrequently drawn numbers
    frequency_distribution = Column(JSON, default={})  # Number frequency over time

    # Pattern analysis
    pattern_analysis = Column(JSON, default={})  # Example: {"consecutive_numbers": {"count": 23, "percentage": 14.7}, "number_ranges": {"low": 45, "medium": 62, "high": 49}}

    # Statistical metrics
    statistical_significance = Column(Float, nullable=True)
    confidence_level = Column(Float, default=0.95)

    # Relationships
    lottery_draw = relationship('LotteryDraw', back_populates='historical_analyses')

    def __repr__(self):
        return f'<HistoricalAnalysis for Draw {self.lottery_draw_id}>'

    def get_hot_numbers(self, count=5):
        """Get top N hot numbers"""
        if not self.hot_numbers:
            return []
        return self.hot_numbers[:count]

    def get_cold_numbers(self, count=5):
        """Get top N cold numbers"""
        if not self.cold_numbers:
            return []
        return self.cold_numbers[:count]

    def get_pattern_stats(self, pattern_type):
        """Get specific pattern analysis statistics"""
        if not self.pattern_analysis:
            return None
        return self.pattern_analysis.get(pattern_type)

    def get_frequency_for_number(self, number):
        """Get frequency for a specific number"""
        if not self.frequency_distribution:
            return None
        return self.frequency_distribution.get(str(number), 0)

    def get_odd_even_ratio(self):
        """Get odd/even number ratio from pattern analysis"""
        if not self.pattern_analysis:
            return None
        return self.pattern_analysis.get('odd_even_ratio')

    def get_consecutive_numbers_info(self):
        """Get consecutive numbers analysis"""
        if not self.pattern_analysis:
            return None
        return self.pattern_analysis.get('consecutive_numbers')

    def get_number_ranges_analysis(self):
        """Get number ranges analysis (low, medium, high)"""
        if not self.pattern_analysis:
            return None
        return self.pattern_analysis.get('number_ranges')

    def is_statistically_significant(self, threshold=0.05):
        """Check if analysis is statistically significant"""
        if self.statistical_significance is None:
            return False
        return self.statistical_significance <= threshold

    def get_summary_insights(self):
        """Get key insights from the analysis"""
        insights = []

        # Hot numbers insight
        hot_nums = self.get_hot_numbers(3)
        if hot_nums:
            insights.append(f"Hottest numbers: {', '.join(map(str, hot_nums))}")

        # Cold numbers insight
        cold_nums = self.get_cold_numbers(3)
        if cold_nums:
            insights.append(f"Coldest numbers: {', '.join(map(str, cold_nums))}")

        # Pattern insights
        odd_even = self.get_odd_even_ratio()
        if odd_even:
            insights.append(f"Odd/even ratio: {odd_even.get('odd', 0)} odd, {odd_even.get('even', 0)} even")

        consecutive = self.get_consecutive_numbers_info()
        if consecutive:
            percentage = consecutive.get('percentage', 0)
            insights.append(f"Consecutive numbers appear in {percentage:.1f}% of draws")

        # Statistical significance
        if self.is_statistically_significant():
            insights.append("Analysis is statistically significant")
        else:
            insights.append("Analysis may not be statistically significant")

        return insights

    def to_dict_with_draw(self):
        """Convert to dictionary including lottery draw information"""
        result = self.to_dict()
        if self.lottery_draw:
            result['lottery_draw'] = {
                'draw_date': self.lottery_draw.draw_date.isoformat() if self.lottery_draw.draw_date else None,
                'draw_number': self.lottery_draw.draw_number,
                'winning_numbers': self.lottery_draw.winning_numbers
            }
        return result