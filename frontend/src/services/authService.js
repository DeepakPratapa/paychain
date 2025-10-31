import api from './api'

export const authService = {
  async getChallenge(walletAddress) {
    const response = await api.post('/auth/challenge', {
      wallet_address: walletAddress,
    })
    return response.data
  },

  async verifySignature(walletAddress, signature, message) {
    const response = await api.post('/auth/verify', {
      wallet_address: walletAddress,
      signature,
      message,
    })
    return response.data
  },

  async signup(userData) {
    const response = await api.post('/auth/signup', userData)
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/users/me')
    return response.data
  },

  async logout() {
    try {
      // Call backend logout endpoint
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Always clear local storage regardless of API call result
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  },
}
