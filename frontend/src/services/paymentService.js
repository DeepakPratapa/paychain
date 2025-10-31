import api from './api'

export const paymentService = {
  /**
   * Get wallet balance
   * @param {string} walletAddress - Ethereum wallet address
   */
  async getBalance(walletAddress) {
    const response = await api.get(`/payment/balance/${walletAddress}`)
    return response.data
  },

  /**
   * Get escrow contract statistics
   */
  async getEscrowStats() {
    const response = await api.get('/payment/escrow/stats')
    return response.data
  },
}
