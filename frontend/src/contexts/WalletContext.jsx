import { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!window.ethereum) return
      
      try {
        // Check if MetaMask has previously connected accounts
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        })
        
        if (accounts.length > 0) {
          // Silently restore wallet connection
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          
          setAccount(accounts[0])
          setProvider(provider)
          setSigner(signer)
        }
      } catch (error) {
        console.error('Failed to restore wallet connection:', error)
      }
    }
    
    checkExistingConnection()
  }, [])

  useEffect(() => {
    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setAccount(null)
          setProvider(null)
          setSigner(null)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
        } else if (accounts[0] !== account) {
          // User switched accounts - force logout
          setAccount(null)
          setProvider(null)
          setSigner(null)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          toast.error('Account changed. Please sign in with the new account.')
          // Force page reload to reset auth state
          window.location.href = '/'
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [account])

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not installed!')
      return null
    }

    try {
      setIsConnecting(true)
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = accounts[0]
      
      setAccount(address)
      setProvider(provider)
      setSigner(signer)
      
      // Don't show toast here - let the calling component handle UI feedback
      return address
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    toast.success('Wallet disconnected')
  }

  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Wallet not connected')
    }
    
    try {
      const signature = await signer.signMessage(message)
      return signature
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }

  const value = {
    account,
    provider,
    signer,
    isConnecting,
    connectWallet,
    disconnectWallet,
    signMessage,
    isConnected: !!account,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
