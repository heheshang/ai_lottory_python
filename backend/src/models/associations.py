"""
Association tables for many-to-many relationships
"""
from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from flask_sqlalchemy import SQLAlchemy

# Import db from the database module to avoid circular imports
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from database import db
except ImportError:
    # Fallback for migration environment
    from flask_sqlalchemy import SQLAlchemy
    db = SQLAlchemy()

# Association table for LotteryType and AnalysisMethod
lottery_type_analysis_methods = Table(
    'lottery_type_analysis_methods',
    db.Model.metadata,
    Column('lottery_type_id', UUID(as_uuid=True), ForeignKey('lottery_types.id'), primary_key=True),
    Column('analysis_method_id', UUID(as_uuid=True), ForeignKey('analysis_methods.id'), primary_key=True)
)