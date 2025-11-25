# Quick Start Guide: Lottery Prediction Website

**Purpose**: Get the lottery prediction system running in development environment quickly
**Created**: 2025-11-25
**Target**: Developers and system administrators

## Prerequisites

### System Requirements
- Python 3.11+ with pip
- Node.js 18+ with npm
- Git
- 4GB+ RAM
- 10GB+ disk space

### External Services
- OpenAI API key (for LangChain integration)
- PostgreSQL 13+ (for production database)
- Redis 6+ (for caching)

## Quick Setup (5 minutes)

### 1. Clone and Initialize
```bash
# Clone the repository
git clone https://github.com/your-org/lottery-prediction.git
cd lottery-prediction

# Switch to the feature branch
git checkout 001-lottery-prediction

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment
```bash
# Edit .env with your settings
nano .env
```

Required environment variables:
```env
# Flask Backend
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///lottery_dev.db  # Use PostgreSQL for production
REDIS_URL=redis://localhost:6379/0

# OpenAI/LangChain
OPENAI_API_KEY=your-openai-api-key-here
LANGCHAIN_MODEL=gpt-4-turbo-preview

# API Settings
API_RATE_LIMIT=100/hour
MAX_PREDICTIONS_PER_DAY=50

# Ethical Compliance
MAX_CONFIDENCE_SCORE=0.85
REQUIRE_RESPONSIBLE_GAMBLING=true
```

### 3. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
flask db upgrade

# Load initial data (lottery types, analysis methods)
python scripts/load_initial_data.py

# Start development server
python run.py
```

Backend will be available at: `http://localhost:5000`

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## Verification

### 1. Health Checks
```bash
# Backend health
curl http://localhost:5000/v1/health

# Frontend health
curl http://localhost:3000
```

### 2. API Test
```bash
# Get lottery types
curl http://localhost:5000/v1/lottery-types

# Get historical data (sample)
curl "http://localhost:5000/v1/lottery-draws?lottery_type=SUPER_LOTTERY&limit=5"
```

### 3. Frontend Test
Open browser and navigate to `http://localhost:3000`:
- View historical lottery data
- Generate sample predictions
- Check responsible gambling disclaimers

## Development Workflow

### Backend Development
```bash
# Run tests
pytest tests/ --cov=src

# Run specific test
pytest tests/test_predictions.py -v

# Code formatting
black src/
isort src/

# Type checking
mypy src/

# Start in debug mode
FLASK_ENV=development python run.py
```

### Frontend Development
```bash
# Run tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Code formatting
npm run format

# Type checking
npm run type-check

# Start with hot reload
npm run dev
```

### Database Management
```bash
# Create new migration
flask db migrate -m "Add new feature"

# Apply migrations
flask db upgrade

# Reset database (development only)
flask db downgrade base
flask db upgrade
```

## Key Features to Test

### 1. Historical Data Access
```bash
# Get last 30 days of draws
curl "http://localhost:5000/v1/lottery-draws?lottery_type=SUPER_LOTTERY&start_date=2024-01-01&end_date=2024-01-30"
```

### 2. Statistical Analysis
```bash
# Get frequency analysis
curl "http://localhost:5000/v1/analysis/statistics?lottery_type=SUPER_LOTTERY&start_date=2024-01-01&end_date=2024-01-30&analysis_types=frequency"
```

### 3. Prediction Generation (requires auth)
```bash
# Generate prediction
curl -X POST http://localhost:5000/v1/predictions/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lottery_type": "SUPER_LOTTERY",
    "analysis_methods": ["WEIGHTED_FREQUENCY"],
    "prediction_count": 3
  }'
```

## Configuration Reference

### Backend Configuration (`config.py`)
```python
class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True
    TEMPLATES_AUTO_RELOAD = True

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False
    TEMPLATES_AUTO_RELOAD = False
```

### Frontend Configuration (`frontend/src/config.js`)
```javascript
export default {
  apiUrl: process.env.VUE_APP_API_URL || 'http://localhost:5000/v1',
  enableDevTools: process.env.NODE_ENV === 'development',
  theme: process.env.VUE_APP_THEME || 'light'
}
```

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.11+

# Check virtual environment
which python  # Should point to venv

# Check dependencies
pip list  # Verify all packages installed
```

#### 2. Frontend Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### 3. Database Connection Issues
```bash
# Check SQLite file exists
ls -la lottery_dev.db

# Test database connection
python -c "from app import create_app; create_app().app_context().push(); print('DB OK')"
```

#### 4. API Rate Limiting
```bash
# Check current limits
curl -I http://localhost:5000/v1/lottery-types

# Reset Redis cache (if using)
redis-cli FLUSHALL
```

### Performance Issues

#### Backend Performance
```bash
# Check memory usage
python -m memory_profiler run.py

# Profile slow queries
flask shell
>>> from app import db
>>> db.engine.execute("EXPLAIN ANALYZE SELECT * FROM lottery_draws LIMIT 10")
```

#### Frontend Performance
```bash
# Build analysis
npm run build-analyze

# Bundle size analyzer
npm run stats
```

## Ethical Compliance Checklist

### Required Features
- [ ] Responsible gambling disclaimers on all prediction pages
- [ ] Confidence scores capped at 85%
- [ ] No guarantees of winning displayed
- [ ] Access to gambling help resources
- [ ] User data privacy protection
- [ ] Prediction accuracy limitations clearly stated

### Testing Ethical Compliance
```bash
# Test disclaimer presence
curl http://localhost:5000/v1/predictions/generate | grep "responsible"

# Test confidence capping
python -c "from src.utils.ethical_compliance import EthicalComplianceService; print(EthicalComplianceService.validate_prediction_output({'confidence_score': 0.9}))"
```

## Security Checklist

### Development Security
- [ ] Environment variables not committed to repo
- [ ] Database credentials properly secured
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] Error handling doesn't leak sensitive information

### Security Testing
```bash
# Check for common vulnerabilities
bandit -r src/

# Test API security
sqlmap -u "http://localhost:5000/v1/lottery-draws?lottery_type=TEST"

# Check dependencies for vulnerabilities
pip-audit
npm audit
```

## Monitoring and Logging

### Backend Monitoring
```bash
# Check application logs
tail -f logs/app.log

# Monitor API performance
python scripts/api_monitor.py

# Database performance monitoring
python scripts/db_monitor.py
```

### Frontend Monitoring
```bash
# Check browser console for errors
# Open browser dev tools

# Monitor bundle size
npm run stats
```

## Next Steps

### Development Workflow
1. Create feature branch from `001-lottery-prediction`
2. Implement changes with tests
3. Run full test suite
4. Submit pull request with constitution compliance check

### Production Deployment
1. Set up PostgreSQL database
2. Configure Redis for caching
3. Set up SSL certificates
4. Configure environment variables
5. Run database migrations
6. Deploy behind reverse proxy (nginx)
7. Set up monitoring and alerting

## Support

### Documentation
- [API Documentation](contracts/api.yaml)
- [Database Schema](data-model.md)
- [Constitution](../../.specify/memory/constitution.md)

### Getting Help
- Check [troubleshooting guide](#troubleshooting)
- Review [research findings](research.md)
- Contact development team

### Contributing
1. Follow constitutional requirements
2. Maintain >90% test coverage
3. Include ethical compliance in all features
4. Document responsible gambling considerations