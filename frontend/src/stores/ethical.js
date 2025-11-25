/**
 * Ethical compliance store for managing constitutional requirements and responsible gambling
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from './app'

export const useEthicalStore = defineStore('ethical', () => {
  const appStore = useAppStore()

  // State
  const complianceSettings = ref({
    maxConfidenceScore: 0.85,
    responsibleGamblingRequired: true,
    disclaimersEnabled: true,
    statisticalValidationEnabled: true,
    transparencyRequired: true,
    dailyPredictionLimit: 50,
    coolingOffPeriod: 24, // hours
    selfExclusionEnabled: true
  })

  const disclaimerHistory = ref([])
  const userComplianceStatus = ref({
    responsibleGamblingAcknowledged: false,
    selfExclusionActive: false,
    lastAcknowledgment: null,
    violationCount: 0,
    lastViolation: null,
    riskAssessment: 'low'
  })

  const gamblingWarningShown = ref(false)
  const lastPredictionTime = ref(null)
  const predictionCountToday = ref(0)
  const sessionStartTime = ref(new Date())

  // Computed
  const isCompliant = computed(() => {
    const status = userComplianceStatus.value
    return status.responsibleGamblingAcknowledged && !status.selfExclusionActive
  })

  const needsDisclaimerAcknowledgment = computed(() => {
    return complianceSettings.value.responsibleGamblingRequired &&
           !userComplianceStatus.value.responsibleGamblingAcknowledged
  })

  const isSelfExcluded = computed(() => {
    return userComplianceStatus.value.selfExclusionActive
  })

  const approachingDailyLimit = computed(() => {
    const limit = complianceSettings.value.dailyPredictionLimit
    const count = predictionCountToday.value
    return count >= limit * 0.8 && count < limit
  })

  const hasExceededDailyLimit = computed(() => {
    return predictionCountToday.value >= complianceSettings.value.dailyPredictionLimit
  })

  // Actions
  const acknowledgeResponsibleGambling = async () => {
    try {
      // Record acknowledgment
      userComplianceStatus.value.responsibleGamblingAcknowledged = true
      userComplianceStatus.value.lastAcknowledgment = new Date().toISOString()

      // Add to disclaimer history
      disclaimerHistory.value.push({
        type: 'responsible_gambling',
        timestamp: new Date(),
        acknowledged: true,
        ipAddress: await getClientIp(),
        userAgent: navigator.userAgent
      })

      // Save to localStorage
      saveComplianceToStorage()

      appStore.showSuccessMessage('Responsible gambling requirements acknowledged')
      return true
    } catch (error) {
      console.error('Failed to acknowledge responsible gambling:', error)
      return false
    }
  }

  const showGamblingWarning = (severity = 'medium') => {
    gamblingWarningShown.value = true

    const warnings = {
      low: 'Please remember to gamble responsibly and set reasonable limits.',
      medium: 'Your prediction frequency is increasing. Please consider taking a break and gambling responsibly.',
      high: 'You have made many predictions recently. Please take a break and consider your gambling habits.',
      critical: 'Your prediction activity suggests problematic gambling patterns. Please seek help from gambling support services.'
    }

    appStore.showWarningMessage(warnings[severity], { duration: 8000 })
  }

  const checkPredictionLimit = () => {
    const now = new Date()
    const today = now.toDateString()

    // Reset counter if it's a new day
    if (lastPredictionTime.value && lastPredictionTime.value.toDateString() !== today) {
      predictionCountToday.value = 0
    }

    const limit = complianceSettings.value.dailyPredictionLimit
    const count = predictionCountToday.value

    if (count >= limit) {
      appStore.showErrorMessage(`Daily prediction limit of ${limit} reached. Please try again tomorrow.`)
      return false
    }

    return true
  }

  const recordPrediction = () => {
    const now = new Date()
    const today = now.toDateString()

    // Reset counter if it's a new day
    if (lastPredictionTime.value && lastPredictionTime.value.toDateString() !== today) {
      predictionCountToday.value = 0
    }

    predictionCountToday.value++
    lastPredictionTime.value = now

    // Check for concerning patterns
    checkConcerningPatterns()
  }

  const checkConcerningPatterns = () => {
    const sessionDuration = (new Date() - sessionStartTime.value) / (1000 * 60) // minutes
    const sessionPredictions = predictionCountToday.value

    // Check rapid predictions
    if (sessionPredictions > 20 && sessionDuration < 60) {
      showGamblingWarning('high')
    }

    // Check long sessions
    if (sessionDuration > 120) { // 2 hours
      showGamblingWarning('medium')
    }

    // Check approaching limit
    if (approachingDailyLimit.value) {
      showGamblingWarning('low')
    }
  }

  const initiateSelfExclusion = async (durationDays) => {
    try {
      const result = await ElMessageBox.confirm(
        `Are you sure you want to self-exclude for ${durationDays} days? During this time, you won't be able to generate predictions.`,
        'Self-Exclusion Confirmation',
        {
          confirmButtonText: 'Self-Exclude',
          cancelButtonText: 'Cancel',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )

      // Set self-exclusion
      userComplianceStatus.value.selfExclusionActive = true
      userComplianceStatus.value.exclusionEndDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

      // Add to disclaimer history
      disclaimerHistory.value.push({
        type: 'self_exclusion',
        timestamp: new Date(),
        duration: durationDays,
        endDate: userComplianceStatus.value.exclusionEndDate,
        acknowledged: true,
        ipAddress: await getClientIp(),
        userAgent: navigator.userAgent
      })

      // Save to storage
      saveComplianceToStorage()

      appStore.showSuccessMessage(`Self-exclusion activated until ${userComplianceStatus.value.exclusionEndDate.toLocaleDateString()}`)

      // Log out user
      const authStore = useAuthStore()
      if (authStore.isAuthenticated) {
        authStore.logout()
      }

      return true
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Self-exclusion failed:', error)
        appStore.showErrorMessage('Failed to activate self-exclusion')
      }
      return false
    }
  }

  const validatePrediction = (predictionData) => {
    const violations = []

    // Check confidence score
    if (predictionData.confidence_score > complianceSettings.value.maxConfidenceScore) {
      violations.push(`Confidence score ${predictionData.confidence_score} exceeds constitutional maximum of ${complianceSettings.value.maxConfidenceScore}`)
    }

    // Check disclaimer acknowledgment
    if (needsDisclaimerAcknowledgment.value && !predictionData.disclaimer_acknowledged) {
      violations.push('Responsible gambling disclaimer must be acknowledged')
    }

    // Check user is not self-excluded
    if (isSelfExcluded.value) {
      violations.push('User is currently self-excluded and cannot generate predictions')
    }

    // Check daily limit
    if (hasExceededDailyLimit.value) {
      violations.push(`Daily prediction limit of ${complianceSettings.value.dailyPredictionLimit} has been reached`)
    }

    return {
      isCompliant: violations.length === 0,
      violations
    }
  }

  const applyComplianceToPrediction = (predictionData) => {
    const compliantData = { ...predictionData }

    // Apply confidence score cap
    if (compliantData.confidence_score > complianceSettings.value.maxConfidenceScore) {
      compliantData.confidence_score = complianceSettings.value.maxConfidenceScore
      compliantData.confidence_adjusted = true
      compliantData.original_confidence = predictionData.confidence_score
    }

    // Add compliance metadata
    compliantData.ethical_compliance = {
      confidence_capped_at: complianceSettings.value.maxConfidenceScore,
      disclaimers_required: needsDisclaimerAcknowledgment.value,
      responsible_gambling_enforced: complianceSettings.value.responsibleGamblingRequired,
      timestamp: new Date().toISOString()
    }

    return compliantData
  }

  const getRequiredDisclaimers = () => {
    return [
      {
        id: 'randomness',
        title: 'Randomness Disclaimer',
        message: 'Lottery outcomes are fundamentally random and unpredictable. Past results do not influence future outcomes.',
        type: 'warning',
        required: true
      },
      {
        id: 'financial_advice',
        title: 'Not Financial Advice',
        message: 'This service provides entertainment and statistical analysis only. It is not financial or investment advice.',
        type: 'warning',
        required: true
      },
      {
        id: 'responsible_gambling',
        title: 'Responsible Gambling',
        message: 'Please gamble responsibly. Set limits and know when to stop. If you need help, contact gambling support services.',
        type: 'warning',
        required: true
      },
      {
        id: 'entertainment',
        title: 'Entertainment Purpose',
        message: 'This service is for entertainment purposes only. Do not spend more than you can afford to lose.',
        type: 'info',
        required: true
      },
      {
        id: 'confidence_limitation',
        title: 'Confidence Limitation',
        message: `Confidence scores are capped at ${complianceSettings.value.maxConfidenceScore} for ethical reasons and do not indicate predictive accuracy.`,
        type: 'info',
        required: true
      }
    ]
  }

  const getGamblingResources = () => {
    return {
      helplines: [
        {
          name: 'National Problem Gambling Helpline (US)',
          phone: '1-800-522-4700',
          website: 'https://www.ncpgambling.org/help-treatment/problem-gambling-helpline/'
        },
        {
          name: 'National Gambling Helpline (UK)',
          phone: '0808 8020 133',
          website: 'https://www.gamblinghelpline.org.uk/'
        },
        {
          name: ' gambling help online',
          website: 'https://www.gamblinghelp.org/'
        }
      ],
      counseling: [
        {
          name: 'Gamblers Anonymous',
          website: 'https://www.gamblersanonymous.org/'
        },
        {
          name: 'Gam-Anon',
          website: 'https://www.gam-anon.org/'
        }
      ],
      resources: [
        {
          name: 'National Council on Problem Gambling',
          website: 'https://www.ncpgambling.org/'
        },
        {
          name: 'Responsible Gambling Council',
          website: 'https://www.responsiblegambling.org/'
        }
      ],
      selfHelp: [
        {
          name: 'Self-Assessment Tools',
          website: 'https://www.ncpgambling.org/self-assessment/'
        },
        {
          name: 'Do I have a gambling problem?',
          website: 'https://www.ncpgambling.org/help-treatment/problems/gambling/'
        }
      ]
    }
  }

  const getSelfExclusionOptions = () => {
    return [
      { days: 7, label: '1 Week' },
      { days: 30, label: '1 Month' },
      { days: 90, label: '3 Months' },
      { days: 180, label: '6 Months' },
      { days: 365, label: '1 Year' }
    ]
  }

  const updateComplianceSettings = (settings) => {
    Object.assign(complianceSettings.value, settings)
    saveComplianceToStorage()
  }

  const getComplianceReport = () => {
    const now = new Date()
    const today = now.toDateString()

    return {
      timestamp: now.toISOString(),
      userStatus: {
        isCompliant: isCompliant.value,
        isSelfExcluded: isSelfExcluded.value,
        needsDisclaimerAcknowledgment: needsDisclaimerAcknowledgment.value,
        riskAssessment: userComplianceStatus.value.riskAssessment
      },
      activityStats: {
        predictionsToday: predictionCountToday.value,
        dailyLimit: complianceSettings.value.dailyPredictionLimit,
        limitReached: hasExceededDailyLimit.value,
        sessionDuration: Math.floor((now - sessionStartTime.value) / (1000 * 60)),
        lastPrediction: lastPredictionTime.value
      },
      constitutionalCompliance: {
        maxConfidenceScore: complianceSettings.value.maxConfidenceScore,
        responsibleGamblingRequired: complianceSettings.value.responsibleGamblingRequired,
        disclaimersEnabled: complianceSettings.value.disclaimersEnabled,
        transparencyRequired: complianceSettings.value.transparencyRequired
      },
      recommendations: getPersonalizedRecommendations()
    }
  }

  const getPersonalizedRecommendations = () => {
    const recommendations = []

    const stats = getComplianceReport()

    if (stats.userStatus.isSelfExcluded) {
      recommendations.push({
        type: 'critical',
        message: 'You are currently self-excluded. This is a positive step towards responsible gambling.',
        action: null
      })
    }

    if (stats.activityStats.limitReached) {
      recommendations.push({
        type: 'warning',
        message: 'You have reached your daily prediction limit. Consider taking a break.',
        action: 'Try again tomorrow'
      })
    }

    if (stats.activityStats.sessionDuration > 120) {
      recommendations.push({
        type: 'suggestion',
        message: 'Consider taking a break after long gaming sessions.',
        action: 'Rest your eyes and mind'
      })
    }

    if (stats.activityStats.predictionsToday > 30) {
      recommendations.push({
        type: 'suggestion',
        message: 'Consider moderating your prediction frequency.',
        action: 'Focus on quality over quantity'
      })
    }

    return recommendations
  }

  const saveComplianceToStorage = () => {
    const complianceData = {
      settings: complianceSettings.value,
      status: userComplianceStatus.value,
      predictionCountToday: predictionCountToday.value,
      lastPredictionTime: lastPredictionTime.value,
      disclaimerHistory: disclaimerHistory.value.slice(-50), // Keep last 50 entries
      sessionStartTime: sessionStartTime.value.toISOString()
    }

    localStorage.setItem('ethical_compliance', JSON.stringify(complianceData))
  }

  const loadComplianceFromStorage = () => {
    try {
      const stored = localStorage.getItem('ethical_compliance')
      if (stored) {
        const complianceData = JSON.parse(stored)

        // Load settings
        if (complianceData.settings) {
          Object.assign(complianceSettings.value, complianceData.settings)
        }

        // Load status
        if (complianceData.status) {
          Object.assign(userComplianceStatus.value, complianceData.status)
          // Convert dates back to Date objects
          if (userComplianceStatus.value.lastAcknowledgment) {
            userComplianceStatus.value.lastAcknowledgment = new Date(userComplianceStatus.value.lastAcknowledgment)
          }
          if (userComplianceStatus.value.exclusionEndDate) {
            userComplianceStatus.value.exclusionEndDate = new Date(userComplianceStatus.value.exclusionEndDate)
          }

          // Check if self-exclusion has expired
          if (userComplianceStatus.value.exclusionEndDate &&
              userComplianceStatus.value.exclusionEndDate < new Date()) {
            userComplianceStatus.value.selfExclusionActive = false
            userComplianceStatus.value.exclusionEndDate = null
          }
        }

        // Load activity data
        if (complianceData.predictionCountToday !== undefined) {
          const storedDate = new Date(complianceData.lastPredictionTime)
          if (storedDate && storedDate.toDateString() === new Date().toDateString()) {
            predictionCountToday.value = complianceData.predictionCountToday
            lastPredictionTime.value = storedDate
          }
        }

        if (complianceData.disclaimerHistory) {
          disclaimerHistory.value = complianceData.disclaimerHistory.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
        }

        if (complianceData.sessionStartTime) {
          sessionStartTime.value = new Date(complianceData.sessionStartTime)
        }
      }
    } catch (error) {
      console.error('Failed to load compliance data from storage:', error)
    }
  }

  const getClientIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Failed to get client IP:', error)
      return 'unknown'
    }
  }

  const initialize = () => {
    loadComplianceFromStorage()

    // Check if self-exclusion has expired
    if (isSelfExcluded.value && userComplianceStatus.value.exclusionEndDate) {
      const endDate = userComplianceStatus.value.exclusionEndDate
      if (endDate < new Date()) {
        userComplianceStatus.value.selfExclusionActive = false
        userComplianceStatus.value.exclusionEndDate = null
        saveComplianceToStorage()
        appStore.showSuccessMessage('Self-exclusion period has ended')
      }
    }

    // Setup periodic checks
    setInterval(() => {
      checkSelfExclusionStatus()
    }, 60000) // Check every minute

    // Add online/offline listeners
    window.addEventListener('online', () => {
      console.log('User is online - compliance monitoring active')
    })

    window.addEventListener('offline', () => {
      console.log('User is offline - compliance monitoring paused')
    })
  }

  const checkSelfExclusionStatus = () => {
    if (isSelfExcluded.value && userComplianceStatus.value.exclusionEndDate) {
      const endDate = userComplianceStatus.value.exclusionEndDate
      const now = new Date()

      if (endDate <= now) {
        userComplianceStatus.value.selfExclusionActive = false
        userComplianceStatus.value.exclusionEndDate = null
        saveComplianceToStorage()

        appStore.showSuccessMessage('Self-exclusion period has ended')
      }
    }
  }

  return {
    // State
    complianceSettings: readonly(complianceSettings),
    disclaimerHistory: readonly(disclaimerHistory),
    userComplianceStatus: readonly(userComplianceStatus),
    gamblingWarningShown: readonly(gamblingWarningShown),
    predictionCountToday: readonly(predictionCountToday),
    lastPredictionTime: readonly(lastPredictionTime),
    sessionStartTime: readonly(sessionStartTime),

    // Computed
    isCompliant,
    needsDisclaimerAcknowledgment,
    isSelfExcluded,
    approachingDailyLimit,
    hasExceededDailyLimit,

    // Actions
    acknowledgeResponsibleGambling,
    showGamblingWarning,
    checkPredictionLimit,
    recordPrediction,
    checkConcerningPatterns,
    initiateSelfExclusion,
    validatePrediction,
    applyComplianceToPrediction,
    getRequiredDisclaimers,
    getGamblingResources,
    getSelfExclusionOptions,
    updateComplianceSettings,
    getComplianceReport,
    getPersonalizedRecommendations,
    saveComplianceToStorage,
    loadComplianceFromStorage,

    // Initialize
    initialize
  }
})