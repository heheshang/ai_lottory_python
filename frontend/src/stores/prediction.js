/**
 * Prediction store for managing lottery predictions and analysis methods
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from './auth'

export const usePredictionStore = defineStore('prediction', () => {
  const authStore = useAuthStore()

  // State
  const predictionMethods = ref([])
  const userPredictions = ref([])
  const currentPrediction = ref(null)
  const isGenerating = ref(false)
  const predictionError = ref(null)
  const predictionHistory = ref([])
  const bookmarkedPredictions = ref([])

  // Configuration
  const maxConfidenceScore = ref(0.85) // Constitutional requirement
  const predictionTimeout = ref(3000) // 3 seconds

  // Computed
  const hasPredictions = computed(() => userPredictions.value.length > 0)
  const recentPredictions = computed(() =>
    userPredictions.value.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
  )
  const bookmarkedCount = computed(() => bookmarkedPredictions.value.length)

  // Actions
  const fetchPredictionMethods = async () => {
    try {
      const response = await fetch('/api/predictions/methods')
      const data = await response.json()

      if (response.ok) {
        predictionMethods.value = data.methods || []
        return data.methods
      } else {
        throw new Error(data.error || 'Failed to fetch prediction methods')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to fetch prediction methods')
      return []
    }
  }

  const generatePrediction = async (predictionData) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to generate predictions')
      return null
    }

    isGenerating.value = true
    predictionError.value = null

    try {
      // Apply constitutional compliance
      const compliantData = applyConstitutionalCompliance(predictionData)

      const response = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(compliantData)
      })

      const data = await response.json()

      if (response.ok) {
        currentPrediction.value = data.prediction

        // Show ethical disclaimers
        if (data.ethical_disclaimer) {
          ElMessage.warning(data.ethical_disclaimer, { duration: 5000 })
        }
        if (data.responsible_gambling_message) {
          ElMessage.info(data.responsible_gambling_message, { duration: 5000 })
        }

        ElMessage.success('Prediction generated successfully')
        return data.prediction
      } else {
        throw new Error(data.error || 'Failed to generate prediction')
      }
    } catch (err) {
      predictionError.value = err.message
      ElMessage.error(err.message || 'Failed to generate prediction')
      return null
    } finally {
      isGenerating.value = false
    }
  }

  const generateOneClickPrediction = async (lotteryTypeId) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to generate predictions')
      return null
    }

    isGenerating.value = true

    try {
      const response = await fetch('/api/predictions/one-click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ lottery_type_id: lotteryTypeId })
      })

      const data = await response.json()

      if (response.ok) {
        currentPrediction.value = data.prediction
        ElMessage.success('One-click prediction generated successfully')
        return data.prediction
      } else {
        throw new Error(data.error || 'Failed to generate one-click prediction')
      }
    } catch (err) {
      predictionError.value = err.message
      ElMessage.error(err.message || 'Failed to generate one-click prediction')
      return null
    } finally {
      isGenerating.value = false
    }
  }

  const fetchUserPredictions = async (lotteryTypeId = null, bookmarked = false, limit = 50) => {
    if (!authStore.isAuthenticated) {
      return []
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      })

      if (lotteryTypeId) {
        params.append('lottery_type_id', lotteryTypeId)
      }
      if (bookmarked) {
        params.append('bookmarked', 'true')
      }

      const response = await fetch(`/api/user/predictions?${params}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        userPredictions.value = data.predictions || []
        if (bookmarked) {
          bookmarkedPredictions.value = data.predictions || []
        }
        return data.predictions
      } else {
        throw new Error(data.error || 'Failed to fetch predictions')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to fetch predictions')
      return []
    }
  }

  const savePrediction = async (predictionData) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to save predictions')
      return false
    }

    try {
      // Include required constitutional compliance data
      const compliantData = {
        ...predictionData,
        responsible_gambling_shown: true,
        disclaimer_acknowledged: true
      }

      const response = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(compliantData)
      })

      const data = await response.json()

      if (response.ok) {
        userPredictions.value.unshift(data.prediction)
        ElMessage.success('Prediction saved successfully')
        return true
      } else {
        throw new Error(data.error || 'Failed to save prediction')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to save prediction')
      return false
    }
  }

  const bookmarkPrediction = async (predictionId) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to bookmark predictions')
      return false
    }

    try {
      const response = await fetch(`/api/predictions/bookmark/${predictionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        // Update local state
        const prediction = userPredictions.value.find(p => p.id === predictionId)
        if (prediction) {
          prediction.is_bookmarked = !prediction.is_bookmarked
          if (prediction.is_bookmarked) {
            bookmarkedPredictions.value.push(prediction)
          } else {
            bookmarkedPredictions.value = bookmarkedPredictions.value.filter(p => p.id !== predictionId)
          }
        }

        ElMessage.success(prediction.is_bookmarked ? 'Prediction bookmarked' : 'Bookmark removed')
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to bookmark prediction')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to bookmark prediction')
      return false
    }
  }

  const provideFeedback = async (predictionId, feedback) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to provide feedback')
      return false
    }

    try {
      const response = await fetch(`/api/predictions/${predictionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ feedback })
      })

      if (response.ok) {
        // Update local state
        const prediction = userPredictions.value.find(p => p.id === predictionId)
        if (prediction) {
          prediction.user_feedback = feedback
        }

        ElMessage.success('Feedback submitted successfully')
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to submit feedback')
      return false
    }
  }

  const deletePrediction = async (predictionId) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to delete predictions')
      return false
    }

    try {
      await ElMessageBox.confirm(
        'Are you sure you want to delete this prediction?',
        'Confirm Deletion',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const response = await fetch(`/api/user/predictions/${predictionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      if (response.ok) {
        // Update local state
        userPredictions.value = userPredictions.value.filter(p => p.id !== predictionId)
        bookmarkedPredictions.value = bookmarkedPredictions.value.filter(p => p.id !== predictionId)

        ElMessage.success('Prediction deleted successfully')
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete prediction')
      }
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error(err.message || 'Failed to delete prediction')
      }
      return false
    }
  }

  const applyConstitutionalCompliance = (predictionData) => {
    // Apply constitutional requirements
    const compliantData = { ...predictionData }

    // 1. Cap confidence score at 0.85 (constitutional requirement)
    if (compliantData.confidence_score) {
      compliantData.confidence_score = Math.min(compliantData.confidence_score, maxConfidenceScore.value)
    }

    // 2. Ensure disclaimer acknowledgment
    compliantData.disclaimer_acknowledged = compliantData.disclaimer_acknowledged || false

    // 3. Add ethical compliance metadata
    compliantData.ethical_compliance = {
      confidence_capped_at: maxConfidenceScore.value,
      responsible_gambling_shown: true,
      timestamp: new Date().toISOString()
    }

    return compliantData
  }

  const validatePredictionNumbers = (numbers, lotteryType) => {
    if (!numbers || !lotteryType) return false

    const ranges = lotteryType.number_ranges || {}
    const mainRange = ranges.main_numbers || { min: 1, max: 35, count: 5 }
    const bonusRange = ranges.bonus_numbers || { min: 1, max: 12, count: 2 }

    const mainNumbers = numbers.main_numbers || []
    const bonusNumbers = numbers.bonus_numbers || []

    // Validate main numbers
    if (mainNumbers.length !== mainRange.count) return false
    if (mainNumbers.some(n => n < mainRange.min || n > mainRange.max)) return false
    if (new Set(mainNumbers).size !== mainNumbers.length) return false // Check for duplicates

    // Validate bonus numbers
    if (bonusNumbers.length !== bonusRange.count) return false
    if (bonusNumbers.some(n => n < bonusRange.min || n > bonusRange.max)) return false
    if (new Set(bonusNumbers).size !== bonusNumbers.length) return false // Check for duplicates

    return true
  }

  const calculatePredictionAccuracy = (prediction, actualDraw) => {
    if (!prediction.predicted_numbers || !actualDraw.winning_numbers) return 0

    const pred = prediction.predicted_numbers
    const actual = actualDraw.winning_numbers

    const predMain = new Set(pred.main_numbers || [])
    const actualMain = new Set(actual.main_numbers || [])
    const predBonus = new Set(pred.bonus_numbers || [])
    const actualBonus = new Set(actual.bonus_numbers || [])

    const mainMatches = [...predMain].filter(n => actualMain.has(n)).length
    const bonusMatches = [...predBonus].filter(n => actualBonus.has(n)).length

    return (mainMatches + bonusMatches) / (predMain.size + predBonus.size)
  }

  // Initialize store
  const initialize = async () => {
    await fetchPredictionMethods()
    if (authStore.isAuthenticated) {
      await fetchUserPredictions()
    }
  }

  return {
    // State
    predictionMethods: readonly(predictionMethods),
    userPredictions: readonly(userPredictions),
    currentPrediction: readonly(currentPrediction),
    isGenerating: readonly(isGenerating),
    predictionError: readonly(predictionError),
    predictionHistory: readonly(predictionHistory),
    bookmarkedPredictions: readonly(bookmarkedPredictions),

    // Computed
    hasPredictions,
    recentPredictions,
    bookmarkedCount,

    // Configuration
    maxConfidenceScore,
    predictionTimeout,

    // Actions
    fetchPredictionMethods,
    generatePrediction,
    generateOneClickPrediction,
    fetchUserPredictions,
    savePrediction,
    bookmarkPrediction,
    provideFeedback,
    deletePrediction,

    // Utility methods
    applyConstitutionalCompliance,
    validatePredictionNumbers,
    calculatePredictionAccuracy,

    // Initialize
    initialize
  }
})