/**
 * Authentication service for handling user authentication, registration, and session management
 */
import api from './api'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'

class AuthService {
  /**
   * User login with credentials
   */
  async login(credentials) {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/login', credentials, {
        timeout: 15000
      })

      // Update auth store with token and user info
      authStore.login(response.token, response.user)

      // Show success message
      appStore.showSuccessMessage('Login successful')

      return response
    } catch (error) {
      console.error('Login error:', error)
      appStore.showErrorMessage(error.message || 'Login failed')
      throw error
    }
  }

  /**
   * User registration
   */
  async register(userData) {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/register', userData, {
        timeout: 20000
      })

      // Auto-login after successful registration
      authStore.login(response.token, response.user)

      // Show success message
      appStore.showSuccessMessage('Registration successful')

      return response
    } catch (error) {
      console.error('Registration error:', error)
      appStore.showErrorMessage(error.message || 'Registration failed')
      throw error
    }
  }

  /**
   * User logout
   */
  async logout() {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      // Call logout endpoint to invalidate token server-side
      if (authStore.isAuthenticated) {
        await api.post('/auth/logout', {}, { timeout: 5000 })
      }
    } catch (error) {
      console.warn('Logout API call failed:', error)
      // Continue with local logout even if API call fails
    }

    // Clear local auth state
    authStore.logout()
    appStore.showSuccessMessage('Logged out successfully')
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/request-password-reset', { email })
      appStore.showSuccessMessage('Password reset instructions sent to your email')
      return response
    } catch (error) {
      console.error('Password reset request error:', error)
      appStore.showErrorMessage(error.message || 'Failed to send password reset')
      throw error
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/reset-password', resetData)
      appStore.showSuccessMessage('Password reset successful')
      return response
    } catch (error) {
      console.error('Password reset error:', error)
      appStore.showErrorMessage(error.message || 'Failed to reset password')
      throw error
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/refresh', {}, {
        timeout: 10000,
        retries: 1 // Only retry once for refresh
      })

      // Update token in store
      authStore.updateToken(response.token)

      return response
    } catch (error) {
      console.error('Token refresh error:', error)

      // If refresh fails, logout user
      await this.logout()
      throw error
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/verify-email', { token })
      appStore.showSuccessMessage('Email verified successfully')
      return response
    } catch (error) {
      console.error('Email verification error:', error)
      appStore.showErrorMessage(error.message || 'Failed to verify email')
      throw error
    }
  }

  /**
   * Request email verification
   */
  async requestEmailVerification() {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/request-email-verification')
      appStore.showSuccessMessage('Verification email sent')
      return response
    } catch (error) {
      console.error('Email verification request error:', error)
      appStore.showErrorMessage(error.message || 'Failed to send verification email')
      throw error
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username) {
    try {
      const response = await api.get('/auth/check-username', { username }, {
        timeout: 5000,
        retries: 0
      })
      return response.available
    } catch (error) {
      console.error('Username availability check error:', error)
      // Return false on error to be safe
      return false
    }
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email) {
    try {
      const response = await api.get('/auth/check-email', { email }, {
        timeout: 5000,
        retries: 0
      })
      return response.available
    } catch (error) {
      console.error('Email availability check error:', error)
      // Return false on error to be safe
      return false
    }
  }

  /**
   * Validate authentication token
   */
  async validateToken() {
    const authStore = useAuthStore()

    if (!authStore.token) {
      return false
    }

    try {
      const response = await api.post('/auth/validate', {}, {
        timeout: 5000,
        retries: 0
      })
      return response.valid
    } catch (error) {
      console.warn('Token validation failed:', error)
      return false
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.user
    } catch (error) {
      console.error('Get current user error:', error)
      throw error
    }
  }

  /**
   * Update user password
   */
  async updatePassword(passwordData) {
    const appStore = useAppStore()

    try {
      const response = await api.put('/auth/password', passwordData)
      appStore.showSuccessMessage('Password updated successfully')
      return response
    } catch (error) {
      console.error('Password update error:', error)
      appStore.showErrorMessage(error.message || 'Failed to update password')
      throw error
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor() {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/2fa/enable')
      appStore.showSuccessMessage('Two-factor authentication setup initiated')
      return response
    } catch (error) {
      console.error('Enable 2FA error:', error)
      appStore.showErrorMessage(error.message || 'Failed to enable two-factor authentication')
      throw error
    }
  }

  /**
   * Verify two-factor authentication setup
   */
  async verifyTwoFactor(code) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/2fa/verify', { code })
      appStore.showSuccessMessage('Two-factor authentication enabled')
      return response
    } catch (error) {
      console.error('Verify 2FA error:', error)
      appStore.showErrorMessage(error.message || 'Failed to verify two-factor authentication')
      throw error
    }
  }

  /**
   * Disable two-factor authentication
   */
  async disableTwoFactor(password) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/2fa/disable', { password })
      appStore.showSuccessMessage('Two-factor authentication disabled')
      return response
    } catch (error) {
      console.error('Disable 2FA error:', error)
      appStore.showErrorMessage(error.message || 'Failed to disable two-factor authentication')
      throw error
    }
  }

  /**
   * Generate backup codes for two-factor authentication
   */
  async generateBackupCodes() {
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/2fa/backup-codes')
      appStore.showSuccessMessage('Backup codes generated')
      return response
    } catch (error) {
      console.error('Generate backup codes error:', error)
      appStore.showErrorMessage(error.message || 'Failed to generate backup codes')
      throw error
    }
  }

  /**
   * Login with two-factor authentication
   */
  async loginWithTwoFactor(credentials, code) {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    try {
      const response = await api.post('/auth/login-2fa', {
        ...credentials,
        code
      })

      // Update auth store
      authStore.login(response.token, response.user)
      appStore.showSuccessMessage('Login successful')

      return response
    } catch (error) {
      console.error('2FA Login error:', error)
      appStore.showErrorMessage(error.message || 'Two-factor authentication failed')
      throw error
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService