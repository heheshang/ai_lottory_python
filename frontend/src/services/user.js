/**
 * User service for managing user profile, preferences, and account data
 */
import api from './api'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
import { useEthicalStore } from '../stores/ethical'

class UserService {
  /**
   * Get user profile information
   */
  async getUserProfile() {
    try {
      const response = await api.get('/user/profile')
      return response.profile
    } catch (error) {
      console.error('Get user profile error:', error)
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/profile', profileData)
      appStore.showSuccessMessage('Profile updated successfully')
      return response.updated_fields
    } catch (error) {
      console.error('Update user profile error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update profile')
      throw error
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences) {
    const appStore = useAppStore()
    const ethicalStore = useEthicalStore()

    try {
      // Validate preferences against ethical requirements
      if (preferences.max_predictions_daily) {
        const maxAllowed = ethicalStore.complianceSettings.value.dailyPredictionLimit
        if (preferences.max_predictions_daily > maxAllowed) {
          preferences.max_predictions_daily = maxAllowed
          appStore.showWarningMessage(`Prediction limit capped at ${maxAllowed} for responsible gambling`)
        }
      }

      const response = await api.put('/user/preferences', preferences)
      appStore.showSuccessMessage('Preferences updated successfully')
      return response.updated_preferences
    } catch (error) {
      console.error('Update user preferences error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update preferences')
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    try {
      const response = await api.get('/user/statistics')
      return response.statistics
    } catch (error) {
      console.error('Get user statistics error:', error)
      throw error
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivity(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        activity_type: filters.activityType,
        date_from: filters.dateFrom,
        date_to: filters.dateTo
      }

      const response = await api.get('/user/activity', params)
      return response.activities
    } catch (error) {
      console.error('Get user activity error:', error)
      throw error
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file) {
    const appStore = useAppStore()

    try {
      const response = await api.upload('/user/avatar', file, {
        onProgress: (progress) => {
          // Can emit progress event if needed
          console.log(`Upload progress: ${progress}%`)
        }
      })

      appStore.showSuccessMessage('Avatar uploaded successfully')
      return response.avatar_url
    } catch (error) {
      console.error('Upload avatar error:', error)
      appStore.showErrorMessage(error.message || 'Failed to upload avatar')
      throw error
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar() {
    const appStore = useAppStore()

    try {
      await api.delete('/user/avatar')
      appStore.showSuccessMessage('Avatar deleted successfully')
    } catch (error) {
      console.error('Delete avatar error:', error)
      appStore.showErrorMessage(error.message || 'Failed to delete avatar')
      throw error
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/password', passwordData)
      appStore.showSuccessMessage('Password changed successfully')
      return response
    } catch (error) {
      console.error('Change password error:', error)
      appStore.showErrorMessage(error.message || 'Failed to change password')
      throw error
    }
  }

  /**
   * Enable email notifications
   */
  async enableEmailNotifications(notificationTypes) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/user/notifications/email/enable', {
        types: notificationTypes
      })
      appStore.showSuccessMessage('Email notifications enabled')
      return response
    } catch (error) {
      console.error('Enable email notifications error:', error)
      appStore.showErrorMessage(error.message || 'Failed to enable email notifications')
      throw error
    }
  }

  /**
   * Disable email notifications
   */
  async disableEmailNotifications(notificationTypes) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/user/notifications/email/disable', {
        types: notificationTypes
      })
      appStore.showSuccessMessage('Email notifications disabled')
      return response
    } catch (error) {
      console.error('Disable email notifications error:', error)
      appStore.showErrorMessage(error.message || 'Failed to disable email notifications')
      throw error
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings() {
    try {
      const response = await api.get('/user/notifications/settings')
      return response.settings
    } catch (error) {
      console.error('Get notification settings error:', error)
      throw error
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/notifications/settings', settings)
      appStore.showSuccessMessage('Notification settings updated')
      return response.updated_settings
    } catch (error) {
      console.error('Update notification settings error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update notification settings')
      throw error
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(dataTypes = 'all', format = 'json') {
    const appStore = useAppStore()

    try {
      const response = await api.get('/user/export', {
        type: dataTypes,
        format: format
      }, {
        timeout: 60000 // Longer timeout for data export
      })

      appStore.showSuccessMessage('Data export request submitted')
      return response
    } catch (error) {
      console.error('Export user data error:', error)
      appStore.showErrorMessage(error.message || 'Failed to export user data')
      throw error
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount() {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      await api.post('/user/delete-account', {
        confirmation: 'delete my account'
      })

      appStore.showSuccessMessage('Account deletion request received')
      authStore.logout()
      return true
    } catch (error) {
      console.error('Delete account error:', error)
      appStore.showErrorMessage(error.message || 'Failed to delete account')
      throw error
    }
  }

  /**
   * Get responsible gambling status
   */
  async getResponsibleGamblingStatus() {
    try {
      const response = await api.get('/user/responsible-gambling/status')
      return response.status
    } catch (error) {
      console.error('Get responsible gambling status error:', error)
      throw error
    }
  }

  /**
   * Acknowledge responsible gambling requirements
   */
  async acknowledgeResponsibleGambling() {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/user/responsible-gambling/acknowledge')

      // Update local ethical store
      await ethicalStore.acknowledgeResponsibleGambling()

      appStore.showSuccessMessage('Responsible gambling requirements acknowledged')
      return response
    } catch (error) {
      console.error('Acknowledge responsible gambling error:', error)
      appStore.showErrorMessage(error.message || 'Failed to acknowledge requirements')
      throw error
    }
  }

  /**
   * Set self-exclusion
   */
  async setSelfExclusion(durationDays) {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/user/self-exclusion', {
        duration_days: durationDays
      })

      // Update local ethical store
      await ethicalStore.initiateSelfExclusion(durationDays)

      appStore.showSuccessMessage(`Self-exclusion set for ${durationDays} days`)
      return response
    } catch (error) {
      console.error('Set self-exclusion error:', error)
      appStore.showErrorMessage(error.message || 'Failed to set self-exclusion')
      throw error
    }
  }

  /**
   * Cancel self-exclusion
   */
  async cancelSelfExclusion() {
    const ethicalStore = useEthicalStore()
    const appStore = useAppStore()

    try {
      const response = await api.delete('/user/self-exclusion')

      // Update local ethical store
      ethicalStore.userComplianceStatus.value.selfExclusionActive = false
      ethicalStore.userComplianceStatus.value.exclusionEndDate = null
      ethicalStore.saveComplianceToStorage()

      appStore.showSuccessMessage('Self-exclusion cancelled')
      return response
    } catch (error) {
      console.error('Cancel self-exclusion error:', error)
      appStore.showErrorMessage(error.message || 'Failed to cancel self-exclusion')
      throw error
    }
  }

  /**
   * Set deposit limits (for responsible gambling)
   */
  async setDepositLimits(limits) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/limits/deposit', limits)
      appStore.showSuccessMessage('Deposit limits updated')
      return response.limits
    } catch (error) {
      console.error('Set deposit limits error:', error)
      appStore.showErrorMessage(error.message || 'Failed to set deposit limits')
      throw error
    }
  }

  /**
   * Set session limits (for responsible gambling)
   */
  async setSessionLimits(limits) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/limits/session', limits)
      appStore.showSuccessMessage('Session limits updated')
      return response.limits
    } catch (error) {
      console.error('Set session limits error:', error)
      appStore.showErrorMessage(error.message || 'Failed to set session limits')
      throw error
    }
  }

  /**
   * Get betting history
   */
  async getBettingHistory(filters = {}) {
    try {
      const params = {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        status: filters.status
      }

      const response = await api.get('/user/betting-history', params)
      return response.betting_history
    } catch (error) {
      console.error('Get betting history error:', error)
      throw error
    }
  }

  /**
   * Get account settings
   */
  async getAccountSettings() {
    try {
      const response = await api.get('/user/settings')
      return response.settings
    } catch (error) {
      console.error('Get account settings error:', error)
      throw error
    }
  }

  /**
   * Update account settings
   */
  async updateAccountSettings(settings) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/user/settings', settings)
      appStore.showSuccessMessage('Account settings updated')
      return response.updated_settings
    } catch (error) {
      console.error('Update account settings error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update account settings')
      throw error
    }
  }

  /**
   * Verify identity document
   */
  async verifyIdentity(documentData) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/user/verify-identity', documentData, {
        timeout: 30000
      })
      appStore.showSuccessMessage('Identity verification submitted')
      return response
    } catch (error) {
      console.error('Identity verification error:', error)
      appStore.showErrorMessage(error.message || 'Failed to submit identity verification')
      throw error
    }
  }

  /**
   * Get verification status
   */
  async getVerificationStatus() {
    try {
      const response = await api.get('/user/verification-status')
      return response.status
    } catch (error) {
      console.error('Get verification status error:', error)
      throw error
    }
  }
}

// Create singleton instance
const userService = new UserService()

export default userService