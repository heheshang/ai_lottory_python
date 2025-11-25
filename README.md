# Lottery Prediction Website

A data-driven lottery prediction website built with Python Flask backend, Vue.js frontend, and LangChain integration. Features historical data analysis, multiple prediction algorithms, and strict ethical compliance with responsible gambling requirements.

## 🎯 Features

- **Historical Data Analysis**: Comprehensive analysis of lottery draw patterns and trends
- **Multiple Prediction Methods**:
  - Weighted frequency analysis
  - Markov chains modeling
  - Ensemble methods
  - LangChain AI integration with explainable reasoning
- **Ethical AI Compliance**:
  - Confidence scores capped at 85% (constitutional requirement)
  - Mandatory responsible gambling messaging
  - Statistical validation with >90% test coverage
  - Full transparency and explainability

## 🛡️ Constitutional Compliance

This project adheres to strict ethical AI principles:

- **Data-Driven Approach**: Only uses historical lottery data, no superstitions
- **Responsible AI Ethics**: Confidence capped at 85%, prominent disclaimers required
- **Statistical Rigor**: Cross-validation, overfitting prevention, uncertainty quantification
- **Transparency**: Model explanations, confidence intervals, methodology documentation
- **Continuous Testing**: >90% test coverage with statistical validation

## 🏗️ Technical Architecture

### Backend (Python/Flask)
- **Framework**: Flask with application factory pattern
- **Database**: SQLite (development), PostgreSQL (production)
- **Machine Learning**: scikit-learn, pandas, numpy, matplotlib
- **AI Integration**: LangChain for explainable predictions
- **Testing**: pytest with >90% coverage requirement

### Frontend (Vue.js 3)
- **Framework**: Vue.js 3 with Composition API
- **State Management**: Pinia
- **UI Components**: Element Plus
- **Data Visualization**: Chart.js with vue-chartjs
- **Build Tool**: Vite

## 📁 Project Structure

```
├── backend/                 # Flask API backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── api/           # API endpoints
│   │   ├── ml/            # Machine learning models
│   │   └── utils/         # Utilities and helpers
│   ├── tests/             # Test suite
│   ├── templates/         # HTML templates
│   ├── config/            # Configuration
│   └── requirements.txt   # Python dependencies
├── frontend/               # Vue.js frontend
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   ├── public/            # Static assets
│   └── package.json       # Node.js dependencies
├── docs/                  # Documentation
├── .github/workflows/     # CI/CD configuration
└── docker-compose.yml     # Development environment
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lottery-prediction-website
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   flask run
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Docker Development

```bash
# Start all services
docker-compose up

# Production build
docker-compose --profile production up
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest --cov=src --cov-report=html
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### All Tests with Coverage
```bash
# Backend - must maintain >90% coverage
cd backend && pytest --cov-fail-under=90

# Frontend
cd frontend && npm run test:coverage
```

## 📊 Ethical Compliance Requirements

### Prediction Confidence
- **Maximum Allowed**: 85%
- **Constitutional Requirement**: Confidence scores cannot exceed 85%
- **Implementation**: Automatically capped in all prediction models

### Responsible Gambling
- **Mandatory Disclaimers**: All prediction pages include responsible gambling messaging
- **Help Resources**: Links to problem gambling support services
- **User Education**: Information about lottery randomness and responsible play

### Statistical Validation
- **Test Coverage**: >90% required
- **Cross-Validation**: 5-fold cross-validation for all ML models
- **Confidence Intervals**: Required for all predictions
- **Performance Monitoring**: Continuous validation of model performance

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options.

Key constitutional compliance settings:
```bash
MAX_PREDICTION_CONFIDENCE=0.85      # Do not change - constitutional requirement
RESPONSIBLE_GAMBLING_REQUIRED=true  # Do not change - ethical requirement
ETHICAL_DISCLAIMERS_ENABLED=true    # Do not change - compliance requirement
```

## 📈 Performance Requirements

- **Prediction Generation**: < 3 seconds
- **Data Access**: < 30 seconds
- **API Response**: < 1 second
- **System Uptime**: > 99%

## 🛡️ Security

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Secure session management
- Environment variable configuration
- Regular security audits

## 📝 Documentation

- [API Documentation](docs/api/)
- [User Guide](docs/user_guide/)
- [Ethical Guidelines](docs/ethical_guidelines.md)
- [Development Guide](docs/development.md)

## 🤝 Contributing

1. Follow constitutional compliance requirements
2. Maintain >90% test coverage
3. Include ethical disclaimers
4. Ensure statistical validation
5. Update documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Help & Support

### Responsible Gambling Resources
- **National Problem Gambling Helpline**: 1-800-522-4700
- **Online Support**: [National Council on Problem Gambling](https://www.ncpgambling.org/)

### Technical Support
- Create an issue for bug reports
- Check documentation for common questions
- Review ethical guidelines before contributing

---

**⚠️ Important Notice**: This application is for educational and entertainment purposes only. Lottery draws are random events, and no prediction method can guarantee winning outcomes. Please gamble responsibly and within your means.