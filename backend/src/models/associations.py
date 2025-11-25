"""
Association tables for many-to-many relationships
"""
from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from flask_sqlalchemy import SQLAlchemy

# Import db from the main app module
from backend.app import db

# Association table for LotteryType and AnalysisMethod
lottery_type_analysis_methods = Table(
    'lottery_type_analysis_methods',
    db.Model.metadata,
    Column('lottery_type_id', UUID(as_uuid=True), ForeignKey('lottery_types.id'), primary_key=True),
    Column('analysis_method_id', UUID(as_uuid=True), ForeignKey('analysis_methods.id'), primary_key=True)
)