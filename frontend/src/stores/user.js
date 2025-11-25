/**
 * User store for managing user profile, preferences, and activity
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()

  // State
  const userProfile = ref(null)
  const userStatistics = ref(null)
  const userActivity = ref([])
  const userPreferences = ref({
    theme: 'light',
    notifications_enabled: true,
    preferred_analysis_methods: ['weighted_frequency'],
    default_confidence_threshold: 0.7,
    risk_tolerance: 'moderate',
    max_predictions_daily: 50
  })
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const hasProfile = computed(() => !!userProfile.value)
  const userName = computed(() => userProfile.value?.username || authStore.userName)
  const userEmail = computed(() => userProfile.value?.email || authStore.userEmail)
  const isResponsibleGamblingAcknowledged = computed(() =>
    userProfile.value?.responsible_gambling_acknowledged || false
  )
  const riskToleranceLevel = computed(() =>
    userPreferences.value.risk_tolerance || 'moderate'
  )
  const totalPredictions = computed(() =>
    userStatistics.value?.total_predictions || 0
  )
  const averageAccuracy = computed(() =>
    userStatistics.value?.average_accuracy || 0
  )
  const mostUsedMethod = computed(() =>
    userStatistics.value?.most_used_method || 'weighted_frequency'
  )

  // Actions
  const fetchUserProfile = async () => {
    if (!authStore.isAuthenticated) {
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        userProfile.value = data.profile
        // Merge preferences if they exist
        if (data.profile.preferences) {
          userPreferences.value = { ...userPreferences.value, ...data.profile.preferences }
        }
        return data.profile
      } else {
        throw new Error(data.error || 'Failed to fetch user profile')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch user profile')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateUserProfile = async (profileData) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to update profile')
      return false
    }

    isLoading.value = true

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        if (userProfile.value) {
          userProfile.value = { ...userProfile.value, ...data.updated_fields }
        }
        ElMessage.success('Profile updated successfully')
        return true
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to update profile')
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateUserPreferences = async (preferences) => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to update preferences')
      return false
    }

    try {
      // Validate preferences
      const validPreferences = validatePreferences(preferences)
      if (!validPreferences.valid) {
        ElMessage.error(validPreferences.error)
        return false
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ preferences })
      })

      const data = await response.json()

      if (response.ok) {
        userPreferences.value = { ...userPreferences.value, ...preferences }
        ElMessage.success('Preferences updated successfully')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update preferences')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to update preferences')
      return false
    }
  }

  const fetchUserStatistics = async () => {
    if (!authStore.isAuthenticated) {
      return null
    }

    try {
      const response = await fetch('/api/user/statistics', {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        userStatistics.value = data.statistics
        return data.statistics
      } else {
        throw new Error(data.error || 'Failed to fetch user statistics')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to fetch user statistics')
      return null
    }
  }

  const fetchUserActivity = async (activityType = 'all', limit = 100) => {
    if (!authStore.isAuthenticated) {
      return []
    }

    try {
      const params = new URLSearchParams({
        type: activityType,
        limit: limit.toString()
      })

      const response = await fetch(`/api/user/activity?${params}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        userActivity.value = data.activities
        return data.activities
      } else {
        throw new Error(data.error || 'Failed to fetch user activity')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to fetch user activity')
      return []
    }
  }

  const exportUserData = async (dataType = 'all', format = 'json') => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to export data')
      return null
    }

    try {
      const params = new URLSearchParams({
        type: dataType,
        format: format
      })

      const response = await fetch(`/api/user/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        ElMessage.success('Data export request submitted')
        return data
      } else {
        throw new Error(data.error || 'Failed to export data')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to export data')
      return null
    }
  }

  const deleteAccount = async () => {
    if (!authStore.isAuthenticated) {
      ElMessage.error('Please login to delete account')
      return false
    }

    try {
      const { ElMessageBox } = await import('element-plus')

      await ElMessageBox.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
        'Delete Account',
        {
          confirmButtonText: 'Delete Account',
          cancelButtonText: 'Cancel',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )

      await ElMessageBox.prompt(
        'Please type "delete my account" to confirm:',
        'Confirmation Required',
        {
          confirmButtonText: 'Delete',
          cancelButtonText: 'Cancel',
          inputPattern: /^delete my account$/,
          inputErrorMessage: 'Please type exactly "delete my account"'
        }
      )

      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ confirmation: 'delete my account' })
      })

      if (response.ok) {
        ElMessage.success('Account deletion request received. You will be logged out.')
        authStore.logout()
        return true
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }
    } catch (err) {
      if (err !== 'cancel') {
        ElMessage.error(err.message || 'Failed to delete account')
      }
      return false
    }
  }

  const updateTheme = (theme) => {
    userPreferences.value.theme = theme
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    // Save to preferences
    updateUserPreferences({ theme })
  }

  const toggleNotifications = () => {
    const newStatus = !userPreferences.value.notifications_enabled
    userPreferences.value.notifications_enabled = newStatus
    updateUserPreferences({ notifications_enabled: newStatus })
  }

  const updatePreferredMethods = (methods) => {
    userPreferences.value.preferred_analysis_methods = methods
    updateUserPreferences({ preferred_analysis_methods: methods })
  }

  const updateRiskTolerance = (tolerance) => {
    userPreferences.value.risk_tolerance = tolerance
    updateUserPreferences({ risk_tolerance: tolerance })
  }

  const validatePreferences = (preferences) => {
    const errors = []

    // Validate risk tolerance
    if (preferences.risk_tolerance && !['conservative', 'moderate', 'aggressive'].includes(preferences.risk_tolerance)) {
      errors.push('Risk tolerance must be one of: conservative, moderate, aggressive')
    }

    // Validate confidence threshold
    if (preferences.default_confidence_threshold !== undefined) {
      const threshold = preferences.default_confidence_threshold
      if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        errors.push('Confidence threshold must be a number between 0 and 1')
      }
    }

    // Validate max predictions daily
    if (preferences.max_predictions_daily !== undefined) {
      const maxPred = preferences.max_predictions_daily
      if (typeof maxPred !== 'number' || maxPred < 1 || maxPred > 1000) {
        errors.push('Max predictions daily must be a number between 1 and 1000')
      }
    }

    return {
      valid: errors.length === 0,
      error: errors.join(', ')
    }
  }

  const getResponsibleGamblingStatus = () => {
    return {
      acknowledged: isResponsibleGamblingAcknowledged.value,
      risk_level: riskToleranceLevel.value,
      recommendations: getGamblingRecommendations()
    }
  }

  const getGamblingRecommendations = () => {
    const recommendations = []

    const stats = userStatistics.value
    if (stats) {
      // Check for concerning patterns
      if (stats.predictions_this_week > 35) {
        recommendations.push('Consider taking a break - high prediction frequency detected')
      }

      if (stats.average_confidence > 0.8) {
        recommendations.push('Remember that lottery outcomes are random - lower your expectations')
      }

      if (stats.most_active_day === 'Sunday' || stats.most_active_day === 'Saturday') {
        recommendations.push('Avoid gambling on weekends when jackpots are typically higher')
      }
    }

    const tolerance = riskToleranceLevel.value
    if (tolerance === 'aggressive') {
      recommendations.push('Consider setting stricter limits for responsible gambling')
    }

    return recommendations
  }

  // Initialize store
  const initialize = async () => {
    if (authStore.isAuthenticated) {
      await fetchUserProfile()
      await fetchUserStatistics()
    }
  }

  return {
    // State
    userProfile: readonly(userProfile),
    userStatistics: readonly(userStatistics),
    userActivity: readonly(userActivity),
    userPreferences: readonly(userPreferences),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    hasProfile,
    userName,
    userEmail,
    isResponsibleGamblingAcknowledged,
    riskToleranceLevel,
    totalPredictions,
    averageAccuracy,
    mostUsedMethod,

    // Actions
    fetchUserProfile,
    updateUserProfile,
    updateUserPreferences,
    fetchUserStatistics,
    fetchUserActivity,
    exportUserData,
    deleteAccount,

    // Utility methods
    updateTheme,
    toggleNotifications,
    updatePreferredMethods,
    updateRiskTolerance,
    validatePreferences,
    getResponsibleGamblingStatus,
    getGamblingRecommendations,

    // Initialize
    initialize
  }
})