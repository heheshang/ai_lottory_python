/**
 * Authentication store for managing user authentication state
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token') || null)
  const isLoading = ref(false)
  const loginError = ref(null)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || 'user')
  const userName = computed(() => user.value?.username || '')
  const userEmail = computed(() => user.value?.email || '')

  // Actions
  const login = async (credentials) => {
    isLoading.value = true
    loginError.value = null

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (response.ok) {
        token.value = data.token
        user.value = data.user

        // Store token in localStorage
        localStorage.setItem('auth_token', data.token)

        ElMessage.success('Login successful')
        return { success: true, data }
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (error) {
      loginError.value = error.message
      ElMessage.error(error.message || 'Login failed')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    loginError.value = null

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        ElMessage.success('Registration successful! Please log in.')
        return { success: true, data }
      } else {
        throw new Error(data.error || 'Registration failed')
      }
    } catch (error) {
      loginError.value = error.message
      ElMessage.error(error.message || 'Registration failed')
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    ElMessage.success('Logged out successfully')
  }

  const verifyToken = async () => {
    if (!token.value) {
      return false
    }

    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        return true
      } else {
        // Token is invalid, clear it
        logout()
        return false
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
      return false
    }
  }

  const acknowledgeResponsibleGambling = async () => {
    if (!isAuthenticated.value) {
      return false
    }

    try {
      const response = await fetch('/api/auth/responsible-gambling', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        if (user.value) {
          user.value.responsible_gambling_acknowledged = true
        }
        ElMessage.success('Responsible gambling requirements acknowledged')
        return true
      } else {
        throw new Error('Failed to acknowledge responsible gambling')
      }
    } catch (error) {
      ElMessage.error(error.message)
      return false
    }
  }

  const selfExclude = async (durationDays) => {
    if (!isAuthenticated.value) {
      return false
    }

    try {
      const response = await fetch('/api/auth/self-exclude', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration_days: durationDays })
      })

      const data = await response.json()

      if (response.ok) {
        ElMessage.success(`Self-exclusion activated until ${data.excluded_until}`)
        logout() // Log out user after self-exclusion
        return true
      } else {
        throw new Error(data.error || 'Self-exclusion failed')
      }
    } catch (error) {
      ElMessage.error(error.message)
      return false
    }
  }

  const refreshToken = async () => {
    if (!token.value) {
      return false
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        token.value = data.token
        localStorage.setItem('auth_token', data.token)
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  // Initialize store by verifying token
  const initialize = async () => {
    if (token.value) {
      const isValid = await verifyToken()
      if (!isValid) {
        // Token was invalid, already cleared by verifyToken
        return false
      }

      // If token is valid, fetch user data
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          }
        })

        if (response.ok) {
          const data = await response.json()
          user.value = data.profile
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
        logout()
        return false
      }
    }

    return true
  }

  return {
    // State
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    loginError: readonly(loginError),

    // Computed
    isAuthenticated,
    userRole,
    userName,
    userEmail,

    // Actions
    login,
    register,
    logout,
    verifyToken,
    acknowledgeResponsibleGambling,
    selfExclude,
    refreshToken,
    initialize
  }
})