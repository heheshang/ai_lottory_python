/**
 * Analytics service for statistical analysis and reporting
 * Provides insights with ethical considerations and responsible gambling emphasis
 */
import api from './api'
import { useAppStore } from '../stores/app'
import { useEthicalStore } from '../stores/ethical'

class AnalyticsService {
  /**
   * Get user prediction analytics
   */
  async getUserPredictionAnalytics(timeframe = 'month') {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.get('/analytics/user/predictions', { timeframe })

      // Add ethical warnings based on analytics
      const analytics = response.analytics
      if (analytics.prediction_frequency > ethicalStore.complianceSettings.value.dailyPredictionLimit * 0.8) {
        ethicalStore.showGamblingWarning('medium')
      }

      if (analytics.average_confidence > 0.8) {
        appStore.showWarningMessage('High confidence levels detected. Remember lottery outcomes are random.')
      }

      return analytics
    } catch (error) {
      console.error('Get user prediction analytics error:', error)
      throw error
    }
  }

  /**
   * Get statistical analysis dashboard data
   */
  async getStatisticalDashboard(filters = {}) {
    try {
      const params = {
        timeframe: filters.timeframe || 'month',
        lottery_type: filters.lotteryType,
        metrics: filters.metrics || ['accuracy', 'frequency', 'patterns']
      }

      const response = await api.get('/analytics/statistical', params, {
        timeout: 20000
      })

      return response.dashboard
    } catch (error) {
      console.error('Get statistical dashboard error:', error)
      throw error
    }
  }

  /**
   * Get prediction accuracy analysis
   */
  async getAccuracyAnalysis(timeframe = 'month', method = null) {
    const appStore = useAppStore()

    try {
      const params = {
        timeframe,
        method
      }

      const response = await api.get('/analytics/accuracy', params)

      // Add responsible gambling context to accuracy results
      const analysis = response.analysis
      if (analysis.overall_accuracy > 0.5) {
        appStore.showWarningMessage('Accuracy rates are for statistical analysis only and do not predict future outcomes.')
      }

      return analysis
    } catch (error) {
      console.error('Get accuracy analysis error:', error)
      throw error
    }
  }

  /**
   * Get performance comparison between prediction methods
   */
  async getMethodComparison(timeframe = 'month') {
    try {
      const response = await api.get('/analytics/method-comparison', { timeframe })
      return response.comparison
    } catch (error) {
      console.error('Get method comparison error:', error)
      throw error
    }
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(metric, timeframe = 'month') {
    try {
      const response = await api.get(`/analytics/trends/${metric}`, { timeframe })
      return response.trends
    } catch (error) {
      console.error('Get trend analysis error:', error)
      throw error
    }
  }

  /**
   * Get correlation analysis
   */
  async getCorrelationAnalysis(variables, timeframe = 'month') {
    try {
      const response = await api.post('/analytics/correlation', {
        variables,
        timeframe
      }, {
        timeout: 25000
      })

      return response.correlations
    } catch (error) {
      console.error('Get correlation analysis error:', error)
      throw error
    }
  }

  /**
   * Get statistical significance testing
   */
  async getSignificanceTest(testType, data) {
    try {
      const response = await api.post('/analytics/significance', {
        test_type: testType,
        data
      }, {
        timeout: 20000
      })

      return response.test_results
    } catch (error) {
      console.error('Get significance test error:', error)
      throw error
    }
  }

  /**
   * Get prediction confidence distribution
   */
  async getConfidenceDistribution(timeframe = 'month') {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.get('/analytics/confidence-distribution', { timeframe })

      // Check for concerning patterns in confidence distribution
      const distribution = response.distribution
      if (distribution.high_confidence_percentage > 50) {
        ethicalStore.showGamblingWarning('medium')
        appStore.showWarningMessage('High confidence usage detected. Remember that confidence scores are capped for ethical reasons.')
      }

      return distribution
    } catch (error) {
      console.error('Get confidence distribution error:', error)
      throw error
    }
  }

  /**
   * Get risk assessment report
   */
  async getRiskAssessment() {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.get('/analytics/risk-assessment')

      const assessment = response.assessment

      // Show warnings based on risk level
      if (assessment.risk_level === 'high') {
        ethicalStore.showGamblingWarning('high')
        appStore.showErrorMessage('High gambling risk detected. Please consider taking a break.')
      } else if (assessment.risk_level === 'medium') {
        ethicalStore.showGamblingWarning('medium')
        appStore.showWarningMessage('Moderate gambling risk detected. Please consider setting limits.')
      }

      return assessment
    } catch (error) {
      console.error('Get risk assessment error:', error)
      throw error
    }
  }

  /**
   * Get responsible gambling metrics
   */
  async getResponsibleGamblingMetrics() {
    const ethicalStore = useEthicalStore()

    try {
      const response = await api.get('/analytics/responsible-gambling')

      // Update local ethical store with server-side metrics
      const metrics = response.metrics
      if (metrics.prediction_count_today !== ethicalStore.predictionCountToday.value) {
        ethicalStore.predictionCountToday.value = metrics.prediction_count_today
      }

      return metrics
    } catch (error) {
      console.error('Get responsible gambling metrics error:', error)
      throw error
    }
  }

  /**
   * Get behavioral analysis
   */
  async getBehavioralAnalysis(timeframe = 'month') {
    try {
      const response = await api.get('/analytics/behavior', { timeframe })
      return response.behavior
    } catch (error) {
      console.error('Get behavioral analysis error:', error)
      throw error
    }
  }

  /**
   * Get time-based activity patterns
   */
  async getActivityPatterns(timeframe = 'month') {
    try {
      const response = await api.get('/analytics/activity-patterns', { timeframe })
      return response.patterns
    } catch (error) {
      console.error('Get activity patterns error:', error)
      throw error
    }
  }

  /**
   * Get prediction effectiveness metrics
   */
  async getPredictionEffectiveness(methods = null, timeframe = 'month') {
    try {
      const params = {
        methods,
        timeframe
      }

      const response = await api.get('/analytics/effectiveness', params)
      return response.effectiveness
    } catch (error) {
      console.error('Get prediction effectiveness error:', error)
      throw error
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(reportConfig) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/analytics/reports/generate', reportConfig, {
        timeout: 30000
      })

      appStore.showSuccessMessage('Custom report generated successfully')
      return response.report
    } catch (error) {
      console.error('Generate custom report error:', error)
      appStore.showErrorMessage(error.message || 'Failed to generate custom report')
      throw error
    }
  }

  /**
   * Get available report templates
   */
  async getReportTemplates() {
    try {
      const response = await api.get('/analytics/reports/templates')
      return response.templates
    } catch (error) {
      console.error('Get report templates error:', error)
      throw error
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalyticsData(exportConfig) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/analytics/export', exportConfig, {
        timeout: 60000
      })

      appStore.showSuccessMessage('Analytics data export completed')
      return response.export
    } catch (error) {
      console.error('Export analytics data error:', error)
      appStore.showErrorMessage(error.message || 'Failed to export analytics data')
      throw error
    }
  }

  /**
   * Get real-time analytics dashboard
   */
  async getRealTimeDashboard() {
    try {
      const response = await api.get('/analytics/realtime', {
        timeout: 5000
      })
      return response.dashboard
    } catch (error) {
      console.error('Get real-time dashboard error:', error)
      throw error
    }
  }

  /**
   * Get comparative analytics with user base
   */
  async getComparativeAnalytics() {
    const appStore = useAppStore()

    try {
      const response = await api.get('/analytics/comparative')

      // Add context for comparative results
      const comparison = response.comparison
      if (comparison.user_percentile > 80) {
        appStore.showWarningMessage('Your activity level is higher than most users. Please ensure responsible gambling practices.')
      }

      return comparison
    } catch (error) {
      console.error('Get comparative analytics error:', error)
      throw error
    }
  }

  /**
   * Get predictive model performance metrics
   */
  async getModelPerformance() {
    try {
      const response = await api.get('/analytics/model-performance')
      return response.performance
    } catch (error) {
      console.error('Get model performance error:', error)
      throw error
    }
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalyDetection(timeframe = 'month') {
    try {
      const response = await api.get('/analytics/anomalies', { timeframe })
      return response.anomalies
    } catch (error) {
      console.error('Get anomaly detection error:', error)
      throw error
    }
  }

  /**
   * Get statistical validation results
   */
  async getStatisticalValidation(testData) {
    try {
      const response = await api.post('/analytics/validation', testData, {
        timeout: 20000
      })
      return response.validation
    } catch (error) {
      console.error('Get statistical validation error:', error)
      throw error
    }
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService()

export default analyticsService