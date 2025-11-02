import axios from 'axios'
import config from '../config'
import { addCSRFHeader } from '../utils/csrf'

const api = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper function to decode JWT and check expiry
const isTokenExpiringSoon = (token) => {
  if (!token) return true
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresAt = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    // Return true if token expires in less than 5 minutes
    return expiresAt - now < fiveMinutes
  } catch (error) {
    console.error('Error decoding token:', error)
    return true
  }
}

// Helper function to refresh token
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token')
  
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  try {
    const response = await axios.post(`${config.API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    
    const { access_token, refresh_token: new_refresh_token } = response.data
    
    localStorage.setItem('access_token', access_token)
    if (new_refresh_token) {
      localStorage.setItem('refresh_token', new_refresh_token)
    }
    
    return access_token
  } catch (error) {
    // Refresh failed, clear tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    window.location.href = '/'
    throw error
  }
}

// Request interceptor to add auth token and auto-refresh if needed
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token')
    
    // Add CSRF token to all state-changing requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      config.headers = addCSRFHeader(config.headers)
    }
    
    if (token) {
      // Check if token is expiring soon and refresh proactively
      if (isTokenExpiringSoon(token)) {
        if (!isRefreshing) {
          isRefreshing = true
          
          try {
            const newToken = await refreshAccessToken()
            isRefreshing = false
            onTokenRefreshed(newToken)
            config.headers.Authorization = `Bearer ${newToken}`
          } catch (error) {
            isRefreshing = false
            throw error
          }
        } else {
          // Wait for the ongoing refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`
              resolve(config)
            })
          })
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      if (!isRefreshing) {
        isRefreshing = true
        
        try {
          const newToken = await refreshAccessToken()
          isRefreshing = false
          onTokenRefreshed(newToken)
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        } catch (refreshError) {
          isRefreshing = false
          return Promise.reject(refreshError)
        }
      } else {
        // Wait for the ongoing refresh to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(api(originalRequest))
          })
        })
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
