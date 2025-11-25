/**
 * Services index file - centralized export of all API services
 * This provides a single point of import for all service modules
 */

// Import individual services
import api from './api'
import authService from './auth'
import predictionService from './predictions'
import historicalDataService from './historicalData'
import userService from './user'
import analyticsService from './analytics'

// Create services object for easy access
const services = {
  // Core API service
  api,

  // Feature-specific services
  auth: authService,
  predictions: predictionService,
  historicalData: historicalDataService,
  user: userService,
  analytics: analyticsService
}

// Export individual services for direct imports
export {
  api,
  authService,
  predictionService,
  historicalDataService,
  userService,
  analyticsService
}

// Export services object as default
export default services

// Service metadata for debugging and documentation
export const serviceInfo = {
  version: '1.0.0',
  description: 'Lottery Prediction Application Services',
  services: {
    api: {
      name: 'Base API Service',
      description: 'Core API functionality with authentication, error handling, and retry logic',
      methods: ['request', 'get', 'post', 'put', 'patch', 'delete', 'upload', 'batch']
    },
    auth: {
      name: 'Authentication Service',
      description: 'User authentication, registration, and session management',
      methods: ['login', 'register', 'logout', 'refreshToken', 'verifyEmail']
    },
    predictions: {
      name: 'Prediction Service',
      description: 'Lottery prediction generation with ethical compliance',
      methods: ['generatePrediction', 'getPredictionHistory', 'batchGeneratePredictions']
    },
    historicalData: {
      name: 'Historical Data Service',
      description: 'Historical lottery data access and statistical analysis',
      methods: ['getHistoricalResults', 'getNumberFrequencyAnalysis', 'getStatisticalPatterns']
    },
    user: {
      name: 'User Service',
      description: 'User profile management and responsible gambling features',
      methods: ['getUserProfile', 'updateUserPreferences', 'setSelfExclusion']
    },
    analytics: {
      name: 'Analytics Service',
      description: 'Statistical analytics and reporting with responsible gambling insights',
      methods: ['getUserPredictionAnalytics', 'getRiskAssessment', 'getStatisticalDashboard']
    }
  }
}

// Initialize services on app startup
export const initializeServices = async () => {
  try {
    // Perform health check
    const healthCheck = await api.healthCheck()
    if (!healthCheck.healthy) {
      console.warn('API health check failed:', healthCheck.error)
    }

    // Get API version
    const version = await api.getVersion()
    console.log(`API Version: ${version.version}`)

    // Initialize any required service-specific setup
    console.log('All services initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize services:', error)
    return false
  }
}