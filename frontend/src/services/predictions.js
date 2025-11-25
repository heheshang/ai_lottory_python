/**
 * Prediction service for generating and managing lottery predictions
 * Handles ethical compliance and responsible gambling requirements
 */
import api from './api'
import { useEthicalStore } from '../stores/ethical'
import { useAppStore } from '../stores/app'

class PredictionService {
  /**
   * Generate a new lottery prediction
   */
  async generatePrediction(predictionParams) {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    // Check if user is compliant before making prediction
    if (!ethicalStore.isCompliant) {
      if (ethicalStore.isSelfExcluded) {
        throw new Error('You are currently self-excluded and cannot generate predictions')
      }
      if (ethicalStore.needsDisclaimerAcknowledgment) {
        throw new Error('Please acknowledge responsible gambling requirements before generating predictions')
      }
    }

    // Check prediction limits
    if (!ethicalStore.checkPredictionLimit()) {
      throw new Error('Daily prediction limit reached')
    }

    try {
      // Add ethical compliance metadata to request
      const enhancedParams = {
        ...predictionParams,
        ethical_acknowledgment: ethicalStore.userComplianceStatus.value.responsibleGamblingAcknowledged,
        prediction_count_today: ethicalStore.predictionCountToday.value,
        session_duration: Math.floor((new Date() - ethicalStore.sessionStartTime.value) / (1000 * 60))
      }

      const response = await api.post('/predictions/generate', enhancedParams, {
        timeout: 15000,
        retries: 2
      })

      // Record the prediction for compliance tracking
      ethicalStore.recordPrediction()

      // Apply ethical compliance to the response
      const compliantPrediction = ethicalStore.applyComplianceToPrediction(response.prediction)

      // Show appropriate message based on confidence
      if (compliantPrediction.confidence_score > 0.7) {
        appStore.showWarningMessage('High confidence detected. Remember that lottery outcomes are random and unpredictable.')
      } else {
        appStore.showSuccessMessage('Prediction generated successfully')
      }

      return {
        ...response,
        prediction: compliantPrediction
      }
    } catch (error) {
      console.error('Prediction generation error:', error)
      appStore.showErrorMessage(error.message || 'Failed to generate prediction')
      throw error
    }
  }

  /**
   * Generate quick prediction with one-click functionality
   */
  async generateQuickPrediction() {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    // Enhanced compliance checks for quick predictions
    if (!ethicalStore.isCompliant) {
      throw new Error('Account compliance required for quick predictions')
    }

    // Check if approaching limit - show warning
    if (ethicalStore.approachingDailyLimit) {
      ethicalStore.showGamblingWarning('medium')
    }

    try {
      const response = await api.post('/predictions/quick-generate', {}, {
        timeout: 10000,
        retries: 1
      })

      ethicalStore.recordPrediction()
      const compliantPrediction = ethicalStore.applyComplianceToPrediction(response.prediction)

      appStore.showSuccessMessage('Quick prediction generated')

      return {
        ...response,
        prediction: compliantPrediction
      }
    } catch (error) {
      console.error('Quick prediction error:', error)
      appStore.showErrorMessage(error.message || 'Failed to generate quick prediction')
      throw error
    }
  }

  /**
   * Get user's prediction history
   */
  async getPredictionHistory(filters = {}) {
    const ethicalStore = useEthicalStore()

    try {
      const params = {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        method: filters.method,
        confidence_min: filters.confidenceMin,
        confidence_max: filters.confidenceMax
      }

      const response = await api.get('/predictions/history', params, {
        timeout: 10000
      })

      // Apply ethical compliance to each prediction
      const compliantPredictions = response.predictions.map(prediction =>
        ethicalStore.applyComplianceToPrediction(prediction)
      )

      return {
        ...response,
        predictions: compliantPredictions
      }
    } catch (error) {
      console.error('Get prediction history error:', error)
      throw error
    }
  }

  /**
   * Get prediction details by ID
   */
  async getPrediction(predictionId) {
    const ethicalStore = useEthicalStore()

    try {
      const response = await api.get(`/predictions/${predictionId}`)
      const compliantPrediction = ethicalStore.applyComplianceToPrediction(response.prediction)

      return {
        ...response,
        prediction: compliantPrediction
      }
    } catch (error) {
      console.error('Get prediction error:', error)
      throw error
    }
  }

  /**
   * Update prediction parameters
   */
  async updatePrediction(predictionId, updateData) {
    const appStore = useAppStore()

    try {
      const response = await api.put(`/predictions/${predictionId}`, updateData)
      appStore.showSuccessMessage('Prediction updated successfully')
      return response
    } catch (error) {
      console.error('Update prediction error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update prediction')
      throw error
    }
  }

  /**
   * Delete a prediction
   */
  async deletePrediction(predictionId) {
    const appStore = useAppStore()

    try {
      const response = await api.delete(`/predictions/${predictionId}`)
      appStore.showSuccessMessage('Prediction deleted successfully')
      return response
    } catch (error) {
      console.error('Delete prediction error:', error)
      appStore.showErrorMessage(error.message || 'Failed to delete prediction')
      throw error
    }
  }

  /**
   * Get available prediction methods
   */
  async getPredictionMethods() {
    try {
      const response = await api.get('/predictions/methods', {}, {
        timeout: 5000
      })
      return response.methods
    } catch (error) {
      console.error('Get prediction methods error:', error)
      throw error
    }
  }

  /**
   * Get prediction statistics
   */
  async getPredictionStatistics(timeframe = 'month') {
    const ethicalStore = useEthicalStore()

    try {
      const response = await api.get('/predictions/statistics', { timeframe })

      // Check for concerning patterns in statistics
      if (response.statistics.predictions_count > ethicalStore.complianceSettings.value.dailyPredictionLimit * 10) {
        ethicalStore.showGamblingWarning('high')
      }

      return response.statistics
    } catch (error) {
      console.error('Get prediction statistics error:', error)
      throw error
    }
  }

  /**
   * Validate prediction parameters
   */
  async validatePredictionParams(params) {
    const ethicalStore = useEthicalStore()

    try {
      const response = await api.post('/predictions/validate', params, {
        timeout: 5000
      })

      // Apply ethical validation
      const ethicalValidation = ethicalStore.validatePrediction(params)
      if (!ethicalValidation.isCompliant) {
        return {
          valid: false,
          errors: [...(response.errors || []), ...ethicalValidation.violations]
        }
      }

      return response
    } catch (error) {
      console.error('Validate prediction params error:', error)
      return {
        valid: false,
        errors: [error.message]
      }
    }
  }

  /**
   * Export prediction history
   */
  async exportPredictions(format = 'json', filters = {}) {
    const appStore = useAppStore()

    try {
      const params = {
        format,
        ...filters
      }

      const response = await api.get('/predictions/export', params, {
        timeout: 30000
      })

      appStore.showSuccessMessage('Prediction export completed')
      return response
    } catch (error) {
      console.error('Export predictions error:', error)
      appStore.showErrorMessage(error.message || 'Failed to export predictions')
      throw error
    }
  }

  /**
   * Batch generate predictions (with enhanced compliance checks)
   */
  async batchGeneratePredictions(batchParams) {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    // Strict compliance for batch predictions
    if (!ethicalStore.isCompliant) {
      throw new Error('Strict compliance required for batch predictions')
    }

    // Check if batch size is reasonable
    if (batchParams.count > 10) {
      throw new Error('Batch size limited to 10 predictions for responsible gambling')
    }

    // Check remaining daily limit
    const remainingLimit = ethicalStore.complianceSettings.value.dailyPredictionLimit - ethicalStore.predictionCountToday.value
    if (batchParams.count > remainingLimit) {
      throw new Error(`Only ${remainingLimit} predictions remaining today`)
    }

    try {
      const response = await api.post('/predictions/batch-generate', batchParams, {
        timeout: 30000,
        retries: 1
      })

      // Record all predictions
      for (let i = 0; i < batchParams.count; i++) {
        ethicalStore.recordPrediction()
      }

      // Apply compliance to all predictions
      const compliantPredictions = response.predictions.map(prediction =>
        ethicalStore.applyComplianceToPrediction(prediction)
      )

      appStore.showSuccessMessage(`Generated ${batchParams.count} predictions`)

      return {
        ...response,
        predictions: compliantPredictions
      }
    } catch (error) {
      console.error('Batch prediction error:', error)
      appStore.showErrorMessage(error.message || 'Failed to generate batch predictions')
      throw error
    }
  }

  /**
   * Get prediction accuracy metrics
   */
  async getAccuracyMetrics(timeframe = 'month') {
    try {
      const response = await api.get('/predictions/accuracy', { timeframe })
      return response.metrics
    } catch (error) {
      console.error('Get accuracy metrics error:', error)
      throw error
    }
  }

  /**
   * Cancel a pending prediction
   */
  async cancelPrediction(predictionId) {
    const appStore = useAppStore()

    try {
      const response = await api.post(`/predictions/${predictionId}/cancel`)
      appStore.showSuccessMessage('Prediction cancelled')
      return response
    } catch (error) {
      console.error('Cancel prediction error:', error)
      appStore.showErrorMessage(error.message || 'Failed to cancel prediction')
      throw error
    }
  }
}

// Create singleton instance
const predictionService = new PredictionService()

export default predictionService