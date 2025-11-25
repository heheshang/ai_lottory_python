/**
 * Lottery store for managing lottery types, historical data, and analysis
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export const useLotteryStore = defineStore('lottery', () => {
  // State
  const lotteryTypes = ref([])
  const historicalData = ref([])
  const frequencyAnalysis = ref(null)
  const patternAnalysis = ref(null)
  const trendAnalysis = ref(null)
  const statistics = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed
  const hasData = computed(() => historicalData.value.length > 0)
  const totalDraws = computed(() => historicalData.value.length)
  const latestDraw = computed(() => historicalData.value[0] || null)

  // Actions
  const fetchLotteryTypes = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/historical/lottery-types')
      const data = await response.json()

      if (response.ok) {
        lotteryTypes.value = data.lottery_types || []
        return data.lottery_types
      } else {
        throw new Error(data.error || 'Failed to fetch lottery types')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch lottery types')
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchHistoricalData = async (lotteryTypeId, startDate, endDate, limit = 100) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate,
        limit: limit.toString()
      })

      const response = await fetch(`/api/historical/draws?${params}`)
      const data = await response.json()

      if (response.ok) {
        historicalData.value = data.draws || []
        return data.draws
      } else {
        throw new Error(data.error || 'Failed to fetch historical data')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch historical data')
      return []
    } finally {
      isLoading.value = false
    }
  }

  const fetchFrequencyAnalysis = async (lotteryTypeId, startDate, endDate) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate
      })

      const response = await fetch(`/api/historical/frequency-analysis?${params}`)
      const data = await response.json()

      if (response.ok) {
        frequencyAnalysis.value = data.analysis
        return data.analysis
      } else {
        throw new Error(data.error || 'Failed to fetch frequency analysis')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch frequency analysis')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchPatternAnalysis = async (lotteryTypeId, startDate, endDate) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate
      })

      const response = await fetch(`/api/historical/pattern-analysis?${params}`)
      const data = await response.json()

      if (response.ok) {
        patternAnalysis.value = data.analysis
        return data.analysis
      } else {
        throw new Error(data.error || 'Failed to fetch pattern analysis')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch pattern analysis')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchTrendAnalysis = async (lotteryTypeId, startDate, endDate, type = 'frequency') => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate,
        type: type
      })

      const response = await fetch(`/api/historical/trend-analysis?${params}`)
      const data = await response.json()

      if (response.ok) {
        trendAnalysis.value = data.trend_analysis
        return data.trend_analysis
      } else {
        throw new Error(data.error || 'Failed to fetch trend analysis')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch trend analysis')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const fetchStatistics = async (lotteryTypeId, startDate, endDate) => {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate
      })

      const response = await fetch(`/api/historical/statistics?${params}`)
      const data = await response.json()

      if (response.ok) {
        statistics.value = data.statistics
        return data.statistics
      } else {
        throw new Error(data.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      error.value = err.message
      ElMessage.error(err.message || 'Failed to fetch statistics')
      return null
    } finally {
      isLoading.value = false
    }
  }

  const exportHistoricalData = async (lotteryTypeId, startDate, endDate, format = 'json') => {
    try {
      const params = new URLSearchParams({
        lottery_type_id: lotteryTypeId,
        start_date: startDate,
        end_date: endDate,
        format: format
      })

      const response = await fetch(`/api/historical/export?${params}`)

      if (response.ok) {
        const data = await response.json()
        ElMessage.success('Data export request submitted')
        return data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export data')
      }
    } catch (err) {
      ElMessage.error(err.message || 'Failed to export data')
      return null
    }
  }

  const getLotteryTypeById = (id) => {
    return lotteryTypes.value.find(type => type.id === id)
  }

  const getHotNumbers = (analysis = null) => {
    const freqAnalysis = analysis || frequencyAnalysis.value
    return freqAnalysis?.main_numbers?.hot_numbers || []
  }

  const getColdNumbers = (analysis = null) => {
    const freqAnalysis = analysis || frequencyAnalysis.value
    return freqAnalysis?.main_numbers?.cold_numbers || []
  }

  const getNumberFrequency = (number, type = 'main_numbers') => {
    if (!frequencyAnalysis.value) return 0
    const freq = frequencyAnalysis.value[`${type}`]?.frequencies
    return freq?.[number.toString()] || 0
  }

  // Utility methods
  const formatDrawDate = (draw) => {
    if (!draw.draw_date) return ''
    return new Date(draw.draw_date).toLocaleDateString()
  }

  const formatWinningNumbers = (draw) => {
    if (!draw.winning_numbers) return { main: [], bonus: [] }
    return {
      main: draw.winning_numbers.main_numbers || [],
      bonus: draw.winning_numbers.bonus_numbers || []
    }
  }

  const calculateNumberStats = (numbers, lotteryType) => {
    if (!numbers || numbers.length === 0) return {}

    const ranges = lotteryType?.number_ranges || {}
    const mainRange = ranges.main_numbers || { min: 1, max: 35 }
    const bonusRange = ranges.bonus_numbers || { min: 1, max: 12 }

    const mainNumbers = numbers.filter((_, index) => index < ranges.main_numbers?.count || 5)
    const bonusNumbers = numbers.slice(ranges.main_numbers?.count || 5)

    return {
      main: {
        count: mainNumbers.length,
        sum: mainNumbers.reduce((a, b) => a + b, 0),
        average: mainNumbers.reduce((a, b) => a + b, 0) / mainNumbers.length,
        min: Math.min(...mainNumbers),
        max: Math.max(...mainNumbers),
        range: Math.max(...mainNumbers) - Math.min(...mainNumbers)
      },
      bonus: {
        count: bonusNumbers.length,
        sum: bonusNumbers.reduce((a, b) => a + b, 0),
        average: bonusNumbers.reduce((a, b) => a + b, 0) / bonusNumbers.length,
        min: Math.min(...bonusNumbers),
        max: Math.max(...bonusNumbers),
        range: Math.max(...bonusNumbers) - Math.min(...bonusNumbers)
      }
    }
  }

  const getDrawsInDateRange = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return historicalData.value.filter(draw => {
      const drawDate = new Date(draw.draw_date)
      return drawDate >= start && drawDate <= end
    })
  }

  // Initialize store
  const initialize = async () => {
    await fetchLotteryTypes()
  }

  return {
    // State
    lotteryTypes: readonly(lotteryTypes),
    historicalData: readonly(historicalData),
    frequencyAnalysis: readonly(frequencyAnalysis),
    patternAnalysis: readonly(patternAnalysis),
    trendAnalysis: readonly(trendAnalysis),
    statistics: readonly(statistics),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    hasData,
    totalDraws,
    latestDraw,

    // Actions
    fetchLotteryTypes,
    fetchHistoricalData,
    fetchFrequencyAnalysis,
    fetchPatternAnalysis,
    fetchTrendAnalysis,
    fetchStatistics,
    exportHistoricalData,

    // Utility methods
    getLotteryTypeById,
    getHotNumbers,
    getColdNumbers,
    getNumberFrequency,
    formatDrawDate,
    formatWinningNumbers,
    calculateNumberStats,
    getDrawsInDateRange,

    // Initialize
    initialize
  }
})