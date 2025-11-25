/**
 * Base API service with common functionality for all API calls
 * Handles authentication, error handling, and ethical compliance
 */
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
import { useEthicalStore } from '../stores/ethical'

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VUE_APP_API_URL || 'http://localhost:5000/api'
    this.defaultTimeout = 30000
    this.maxRetries = 3
  }

  /**
   * Make an authenticated API request with proper error handling
   */
  async request(endpoint, options = {}) {
    const authStore = useAuthStore()
    const appStore = useAppStore()
    const ethicalStore = useEthicalStore()

    const url = `${this.baseURL}${endpoint}`
    const config = {
      timeout: options.timeout || this.defaultTimeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    // Add authentication token if available
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    // Add request metadata for ethical compliance
    if (options.includeEthicalMetadata !== false) {
      config.headers['X-Request-ID'] = this.generateRequestId()
      config.headers['X-Client-Timestamp'] = new Date().toISOString()
    }

    try {
      const response = await fetch(url, config)

      // Handle authentication errors
      if (response.status === 401) {
        await authStore.logout()
        appStore.showErrorMessage('Session expired. Please login again.')
        throw new Error('Authentication required')
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const message = retryAfter
          ? `Rate limit exceeded. Please wait ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please try again later.'
        appStore.showWarningMessage(message)
        throw new Error(message)
      }

      // Handle ethical compliance violations
      if (response.status === 422) {
        const data = await response.json()
        if (data.ethical_violations) {
          ethicalStore.showGamblingWarning('high')
          data.ethical_violations.forEach(violation => {
            appStore.showErrorMessage(violation)
          })
        }
        throw new Error(data.error || 'Ethical compliance violation')
      }

      // Parse response
      let responseData
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      return responseData
    } catch (error) {
      console.error(`API Request Error (${endpoint}):`, error)

      // Retry logic for network errors
      if (this.isNetworkError(error) && (options.retries || 0) < this.maxRetries) {
        const retryCount = options.retries || 0
        console.log(`Retrying request (${retryCount + 1}/${this.maxRetries})...`)

        // Exponential backoff
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

        return this.request(endpoint, {
          ...options,
          retries: retryCount + 1
        })
      }

      // Show user-friendly error message
      if (!error.message.includes('Authentication required') && !error.message.includes('Rate limit')) {
        appStore.showErrorMessage('Network error. Please check your connection and try again.')
      }

      throw error
    }
  }

  /**
   * HTTP GET request
   */
  async get(endpoint, params = {}, options = {}) {
    let url = endpoint
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString()
      url = `${endpoint}?${queryString}`
    }

    return this.request(url, {
      method: 'GET',
      ...options
    })
  }

  /**
   * HTTP POST request
   */
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    })
  }

  /**
   * HTTP PUT request
   */
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    })
  }

  /**
   * HTTP PATCH request
   */
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    })
  }

  /**
   * HTTP DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }

  /**
   * Upload file with progress tracking
   */
  async upload(endpoint, file, options = {}) {
    const authStore = useAuthStore()
    const appStore = useAppStore()

    const url = `${this.baseURL}${endpoint}`
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      method: 'POST',
      body: formData,
      headers: {},
      timeout: options.timeout || 60000 // Longer timeout for uploads
    }

    // Add authentication token
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }

    // Don't set Content-Type header for FormData (browser sets it with boundary)
    delete config.headers['Content-Type']

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            options.onProgress(progress)
          }
        })
      }

      xhr.addEventListener('load', async () => {
        try {
          const contentType = xhr.getResponseHeader('content-type')
          let responseData

          if (contentType && contentType.includes('application/json')) {
            responseData = JSON.parse(xhr.responseText)
          } else {
            responseData = xhr.responseText
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(responseData)
          } else {
            throw new Error(responseData.error || responseData.message || `HTTP ${xhr.status}`)
          }
        } catch (error) {
          reject(error)
        }
      })

      xhr.addEventListener('error', () => {
        appStore.showErrorMessage('Upload failed. Please try again.')
        reject(new Error('Upload failed'))
      })

      xhr.addEventListener('timeout', () => {
        appStore.showErrorMessage('Upload timed out. Please try again.')
        reject(new Error('Upload timed out'))
      })

      xhr.timeout = config.timeout

      // Open and send request
      xhr.open(config.method, url)

      // Set headers
      Object.entries(config.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(config.body)
    })
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error) {
    return (
      error instanceof TypeError ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network Error') ||
      error.message.includes('ERR_NETWORK')
    )
  }

  /**
   * Generate unique request ID for tracking
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Cancel an ongoing request (using AbortController)
   */
  createAbortController() {
    return new AbortController()
  }

  /**
   * Health check for API
   */
  async healthCheck() {
    try {
      const response = await this.request('/health', {
        includeEthicalMetadata: false,
        timeout: 5000
      })
      return { healthy: true, response }
    } catch (error) {
      return { healthy: false, error: error.message }
    }
  }

  /**
   * Get API version information
   */
  async getVersion() {
    try {
      return await this.get('/version', {}, { includeEthicalMetadata: false })
    } catch (error) {
      console.warn('Failed to get API version:', error)
      return { version: 'unknown' }
    }
  }

  /**
   * Batch multiple requests
   */
  async batch(requests) {
    const results = await Promise.allSettled(
      requests.map(({ method, endpoint, data, options }) => {
        return this[method.toLowerCase()](endpoint, data, options)
      })
    )

    return results.map((result, index) => ({
      index,
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService

// Export class for creating additional instances if needed
export { ApiService }