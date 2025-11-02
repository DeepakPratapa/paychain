import { createContext, useContext, useState, useEffect } from 'react'
import { useWallet } from './WalletContext'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'
import { clearCSRFToken } from '../utils/csrf'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { account, signMessage, isConnected } = useWallet()

  useEffect(() => {
    // Load user from localStorage
    const loadUser = async () => {
      const storedUser = localStorage.getItem('user')
      const token = localStorage.getItem('access_token')
      
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Error loading user:', error)
        }
      }
      setIsLoading(false)
    }
    
    loadUser()
  }, [])

  const login = async () => {
    if (!isConnected || !account) {
      // Silent fail - calling component should ensure wallet is connected first
      return { needs_wallet: true }
    }

    try {
      setIsLoading(true)
      
      // Step 1: Get challenge
      const { challenge } = await authService.getChallenge(account)
      
      // Step 2: Sign message
      const signature = await signMessage(challenge)
      
      // Step 3: Verify signature
      const response = await authService.verifySignature(account, signature, challenge)
      
      if (response.needs_signup) {
        // Return needs_signup flag for UI to show registration modal
        return { needs_signup: true, wallet_address: account }
      }
      
      // Store tokens and user
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      toast.success(`Welcome back, ${response.user.username}!`)
      
      return { success: true }
      
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.detail || 'Login failed')
      return { error: true }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (username, email, userType) => {
    if (!isConnected || !account) {
      // Silent fail - calling component should ensure wallet is connected
      return { error: true }
    }

    try {
      setIsLoading(true)
      
      // Step 1: Complete signup with user data
      await authService.signup({
        username,
        email,
        wallet_address: account,
        user_type: userType,
      })
      
      toast.success('Account created successfully!')
      
      // Step 2: Now login to get tokens
      const loginResult = await login()
      
      return loginResult
      
    } catch (error) {
      console.error('Signup error:', error)
      const errorMsg = error.response?.data?.detail || 'Signup failed'
      toast.error(errorMsg)
      return { error: true, message: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    clearCSRFToken() // Clear CSRF token on logout
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
