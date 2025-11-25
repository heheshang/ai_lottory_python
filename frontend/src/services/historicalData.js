/**
 * Historical data service for accessing and analyzing lottery historical data
 * Provides statistical analysis with ethical considerations
 */
import api from './api'
import { useAppStore } from '../stores/app'

class HistoricalDataService {
  /**
   * Get historical lottery results
   */
  async getHistoricalResults(filters = {}) {
    const appStore = useAppStore()

    try {
      const params = {
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        lottery_type: filters.lotteryType,
        sort_by: filters.sortBy || 'date',
        sort_order: filters.sortOrder || 'desc'
      }

      const response = await api.get('/historical/results', params, {
        timeout: 15000,
        retries: 2
      })

      return response
    } catch (error) {
      console.error('Get historical results error:', error)
      appStore.showErrorMessage('Failed to load historical data')
      throw error
    }
  }

  /**
   * Get frequency analysis of numbers
   */
  async getNumberFrequencyAnalysis(filters = {}) {
    try {
      const params = {
        period: filters.period || 'year',
        lottery_type: filters.lotteryType,
        number_count: filters.numberCount || 'all'
      }

      const response = await api.get('/historical/frequency', params, {
        timeout: 10000
      })

      return response.analysis
    } catch (error) {
      console.error('Get frequency analysis error:', error)
      throw error
    }
  }

  /**
   * Get statistical patterns and trends
   */
  async getStatisticalPatterns(timeframe = 'year') {
    try {
      const response = await api.get('/historical/patterns', { timeframe }, {
        timeout: 20000
      })

      return response.patterns
    } catch (error) {
      console.error('Get statistical patterns error:', error)
      throw error
    }
  }

  /**
   * Get hot and cold numbers analysis
   */
  async getHotColdNumbers(period = 'month', lotteryType = null) {
    try {
      const params = {
        period,
        lottery_type: lotteryType
      }

      const response = await api.get('/historical/hot-cold', params, {
        timeout: 10000
      })

      return response.analysis
    } catch (error) {
      console.error('Get hot/cold numbers error:', error)
      throw error
    }
  }

  /**
   * Get consecutive numbers analysis
   */
  async getConsecutiveNumbersAnalysis(filters = {}) {
    try {
      const params = {
        period: filters.period || 'year',
        min_sequence_length: filters.minSequenceLength || 2,
        max_sequence_length: filters.maxSequenceLength || 5
      }

      const response = await api.get('/historical/consecutive', params, {
        timeout: 15000
      })

      return response.analysis
    } catch (error) {
      console.error('Get consecutive numbers analysis error:', error)
      throw error
    }
  }

  /**
   * Get gap analysis (time between number appearances)
   */
  async getGapAnalysis(number, period = 'year') {
    try {
      const response = await api.get(`/historical/gap/${number}`, { period }, {
        timeout: 10000
      })

      return response.gap_analysis
    } catch (error) {
      console.error('Get gap analysis error:', error)
      throw error
    }
  }

  /**
   * Get position frequency analysis
   */
  async getPositionFrequencyAnalysis(period = 'year') {
    try {
      const response = await api.get('/historical/position-frequency', { period }, {
        timeout: 15000
      })

      return response.position_analysis
    } catch (error) {
      console.error('Get position frequency analysis error:', error)
      throw error
    }
  }

  /**
   * Get combination frequency analysis
   */
  async getCombinationAnalysis(filters = {}) {
    try {
      const params = {
        combination_size: filters.combinationSize || 2,
        min_frequency: filters.minFrequency || 5,
        period: filters.period || 'year'
      }

      const response = await api.get('/historical/combinations', params, {
        timeout: 20000
      })

      return response.combinations
    } catch (error) {
      console.error('Get combination analysis error:', error)
      throw error
    }
  }

  /**
   * Get overdue numbers analysis
   */
  async getOverdueNumbersAnalysis(threshold = 30) {
    try {
      const response = await api.get('/historical/overdue', { threshold }, {
        timeout: 10000
      })

      return response.overdue_numbers
    } catch (error) {
      console.error('Get overdue numbers analysis error:', error)
      throw error
    }
  }

  /**
   * Get number distribution by position
   */
  async getNumberDistributionByPosition() {
    try {
      const response = await api.get('/historical/distribution', {}, {
        timeout: 15000
      })

      return response.distribution
    } catch (error) {
      console.error('Get number distribution error:', error)
      throw error
    }
  }

  /**
   * Search for specific patterns in historical data
   */
  async searchPatterns(patternParams) {
    const appStore = useAppStore()

    try {
      const response = await api.post('/historical/search-patterns', patternParams, {
        timeout: 25000
      })

      return response.patterns
    } catch (error) {
      console.error('Search patterns error:', error)
      appStore.showErrorMessage('Failed to search patterns')
      throw error
    }
  }

  /**
   * Get summary statistics
   */
  async getSummaryStatistics(timeframe = 'year') {
    try {
      const response = await api.get('/historical/summary', { timeframe }, {
        timeout: 10000
      })

      return response.summary
    } catch (error) {
      console.error('Get summary statistics error:', error)
      throw error
    }
  }

  /**
   * Export historical data
   */
  async exportHistoricalData(format = 'csv', filters = {}) {
    const appStore = useAppStore()

    try {
      const params = {
        format,
        ...filters
      }

      const response = await api.get('/historical/export', params, {
        timeout: 30000
      })

      appStore.showSuccessMessage('Historical data export completed')
      return response
    } catch (error) {
      console.error('Export historical data error:', error)
      appStore.showErrorMessage(error.message || 'Failed to export historical data')
      throw error
    }
  }

  /**
   * Get data availability information
   */
  async getDataAvailability() {
    try {
      const response = await api.get('/historical/availability', {}, {
        timeout: 5000
      })

      return response.availability
    } catch (error) {
      console.error('Get data availability error:', error)
      throw error
    }
  }

  /**
   * Get recent winning numbers
   */
  async getRecentWinningNumbers(count = 10) {
    try {
      const response = await api.get('/historical/recent', { count }, {
        timeout: 5000
      })

      return response.recent_numbers
    } catch (error) {
      console.error('Get recent winning numbers error:', error)
      throw error
    }
  }

  /**
   * Get jackpot history
   */
  async getJackpotHistory(timeframe = 'year') {
    try {
      const response = await api.get('/historical/jackpot', { timeframe }, {
        timeout: 10000
      })

      return response.jackpot_history
    } catch (error) {
      console.error('Get jackpot history error:', error)
      throw error
    }
  }

  /**
   * Get number trends over time
   */
  async getNumberTrends(numbers, timeframe = 'year') {
    try {
      const params = {
        numbers: Array.isArray(numbers) ? numbers.join(',') : numbers,
        timeframe
      }

      const response = await api.get('/historical/trends', params, {
        timeout: 15000
      })

      return response.trends
    } catch (error) {
      console.error('Get number trends error:', error)
      throw error
    }
  }

  /**
   * Compare historical periods
   */
  async comparePeriods(period1, period2) {
    try {
      const response = await api.post('/historical/compare', {
        period1,
        period2
      }, {
        timeout: 20000
      })

      return response.comparison
    } catch (error) {
      console.error('Compare periods error:', error)
      throw error
    }
  }

  /**
   * Get random samples from historical data
   */
  async getRandomSample(count = 10, filters = {}) {
    try {
      const params = {
        count,
        ...filters
      }

      const response = await api.get('/historical/random-sample', params, {
        timeout: 10000
      })

      return response.samples
    } catch (error) {
      console.error('Get random sample error:', error)
      throw error
    }
  }
}

// Create singleton instance
const historicalDataService = new HistoricalDataService()

export default historicalDataService