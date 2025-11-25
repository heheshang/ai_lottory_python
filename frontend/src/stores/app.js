/**
 * Application store for global app state, settings, and configuration
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false)
  const sidebarCollapsed = ref(false)
  const theme = ref(localStorage.getItem('app_theme') || 'light')
  const language = ref(localStorage.getItem('app_language') || 'zh')
  const notifications = ref([])
  const onlineStatus = ref(navigator.onLine)
  const apiBaseUrl = ref(import.meta.env.VUE_APP_API_URL || 'http://localhost:5000/api')
  const appVersion = ref('1.0.0')

  // Ethical compliance state
  const ethicalCompliance = ref({
    confidenceCap: 0.85,
    responsibleGamblingEnabled: true,
    disclaimersRequired: true,
    statisticalValidationRequired: true
  })

  // App configuration
  const appConfig = ref({
    apiTimeout: parseInt(import.meta.env.VUE_APP_API_TIMEOUT) || 30000,
    maxRetries: 3,
    retryDelay: 1000,
    enableAnimations: true,
    enableSounds: false,
    autoSave: true,
    sessionTimeout: 30 * 60 * 1000 // 30 minutes
  })

  // Computed
  const isDarkTheme = computed(() => theme.value === 'dark')
  const isOnline = computed(() => onlineStatus.value)
  const hasNotifications = computed(() => notifications.value.length > 0)
  const unreadNotifications = computed(() =>
    notifications.value.filter(n => !n.read).length
  )

  // Actions
  const setTheme = (newTheme) => {
    if (['light', 'dark'].includes(newTheme)) {
      theme.value = newTheme
      localStorage.setItem('app_theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme.value === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const setLanguage = (newLanguage) => {
    language.value = newLanguage
    localStorage.setItem('app_language', newLanguage)
  }

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setSidebarCollapsed = (collapsed) => {
    sidebarCollapsed.value = collapsed
  }

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(id)
      }, 5000)
    }

    // Limit notifications to prevent memory issues
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 25)
    }

    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const markNotificationAsRead = (id) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(n => {
      n.read = true
    })
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  const showSuccessMessage = (message, options = {}) => {
    return ElMessage.success({
      message,
      showClose: true,
      duration: options.duration || 3000,
      ...options
    })
  }

  const showErrorMessage = (message, options = {}) => {
    return ElMessage.error({
      message,
      showClose: true,
      duration: options.duration || 5000,
      ...options
    })
  }

  const showWarningMessage = (message, options = {}) => {
    return ElMessage.warning({
      message,
      showClose: true,
      duration: options.duration || 4000,
      ...options
    })
  }

  const showInfoMessage = (message, options = {}) => {
    return ElMessage.info({
      message,
      showClose: true,
      duration: options.duration || 3000,
      ...options
    })
  }

  const updateOnlineStatus = () => {
    onlineStatus.value = navigator.onLine

    if (navigator.onLine) {
      showSuccessMessage('Connection restored')
    } else {
      showErrorMessage('Connection lost. Please check your internet connection.')
    }
  }

  const setGlobalLoading = (loading) => {
    isLoading.value = loading
  }

  // Ethical compliance methods
  const validateEthicalCompliance = (predictionData) => {
    const violations = []

    // Check confidence score cap
    if (predictionData.confidence_score > ethicalCompliance.value.confidenceCap) {
      violations.push(`Confidence score exceeds constitutional limit of ${ethicalCompliance.value.confidenceCap}`)
    }

    // Check disclaimer acknowledgment
    if (ethicalCompliance.value.disclaimersRequired && !predictionData.disclaimer_acknowledged) {
      violations.push('Responsible gambling disclaimer must be acknowledged')
    }

    return {
      isCompliant: violations.length === 0,
      violations
    }
  }

  const applyEthicalCompliance = (predictionData) => {
    const compliantData = { ...predictionData }

    // Apply confidence cap
    if (compliantData.confidence_score > ethicalCompliance.value.confidenceCap) {
      compliantData.confidence_score = ethicalCompliance.value.confidenceCap
      compliantData.confidence_adjusted = true
    }

    // Ensure disclaimer requirement
    if (ethicalCompliance.value.disclaimersRequired && !compliantData.disclaimer_acknowledged) {
      compliantData.disclaimer_required = true
    }

    return compliantData
  }

  const getEthicalDisclaimer = () => {
    return {
      randomnes: 'Lottery outcomes are fundamentally random and unpredictable. Past results do not influence future outcomes.',
      financialAdvice: 'This service provides entertainment and statistical analysis only. It is not financial or investment advice.',
      responsibleGambling: 'Please gamble responsibly. Set limits and know when to stop. If you need help, contact gambling support services.',
      entertainment: 'This service is for entertainment purposes only. Do not spend more than you can afford to lose.',
      confidence: `Confidence scores are capped at ${ethicalCompliance.value.confidenceCap} for ethical reasons.`
    }
  }

  const getResponsibleGamblingResources = () => {
    return {
      helpline: {
        name: 'National Problem Gambling Helpline',
        phone: '1-800-522-4700',
        website: 'https://www.ncpgambling.org/help-treatment/problem-gambling-helpline/'
      },
      counseling: {
        name: 'Gamblers Anonymous',
        website: 'https://www.gamblersanonymous.org/'
      },
      resources: {
        name: 'National Council on Problem Gambling',
        website: 'https://www.ncpgambling.org/'
      },
      selfAssessment: {
        name: 'Self-Assessment Tool',
        website: 'https://www.ncpgambling.org/self-assessment/'
      }
    }
  }

  // API methods
  const apiRequest = async (endpoint, options = {}) => {
    const url = `${apiBaseUrl.value}${endpoint}`
    const config = {
      timeout: appConfig.value.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // Add auth token if available
    // This would be handled by individual API calls

    try {
      const response = await fetch(url, config)
      return response
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  const checkApiHealth = async () => {
    try {
      const response = await apiRequest('/health')
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }

  // Utility methods
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (amount, currency = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    }).format(new Date(date))
  }

  const formatTime = (date, options = {}) => {
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    }).format(new Date(date))
  }

  const formatDateTime = (date, options = {}) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(new Date(date))
  }

  // Initialize app
  const initialize = () => {
    // Set theme
    document.documentElement.setAttribute('data-theme', theme.value)

    // Add event listeners
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Check API health
    checkApiHealth().then(isHealthy => {
      if (!isHealthy) {
        showErrorMessage('API health check failed. Some features may not work correctly.')
      }
    })

    // Load saved settings
    const savedSettings = localStorage.getItem('app_settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        Object.assign(appConfig.value, settings)
      } catch (error) {
        console.error('Failed to load app settings:', error)
      }
    }
  }

  return {
    // State
    isLoading: readonly(isLoading),
    sidebarCollapsed: readonly(sidebarCollapsed),
    theme: readonly(theme),
    language: readonly(language),
    notifications: readonly(notifications),
    onlineStatus: readonly(onlineStatus),
    apiBaseUrl: readonly(apiBaseUrl),
    appVersion: readonly(appVersion),
    ethicalCompliance: readonly(ethicalCompliance),
    appConfig: readonly(appConfig),

    // Computed
    isDarkTheme,
    isOnline,
    hasNotifications,
    unreadNotifications,

    // Actions
    setTheme,
    toggleTheme,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,

    // Notifications
    addNotification,
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,

    // Message helpers
    showSuccessMessage,
    showErrorMessage,
    showWarningMessage,
    showInfoMessage,

    // Loading
    setGlobalLoading,

    // Ethical compliance
    validateEthicalCompliance,
    applyEthicalCompliance,
    getEthicalDisclaimer,
    getResponsibleGamblingResources,

    // API
    apiRequest,
    checkApiHealth,

    // Utilities
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime,

    // Initialize
    initialize
  }
})