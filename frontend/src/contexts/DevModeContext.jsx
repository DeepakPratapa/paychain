import { createContext, useContext, useState, useEffect } from 'react'
import { useWallet } from './WalletContext'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const DevModeContext = createContext()

export const useDevMode = () => {
  const context = useContext(DevModeContext)
  if (!context) {
    throw new Error('useDevMode must be used within DevModeProvider')
  }
  return context
}

// Preconfigured demo accounts from seed data
const DEMO_ACCOUNTS = [
  {
    name: 'TechStartupCo (Employer)',
    wallet: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    username: 'TechStartupCo',
    email: 'ceo@techstartup.com',
    userType: 'employer',
    description: 'Tech startup looking for developers',
  },
  {
    name: 'DesignAgency (Employer)',
    wallet: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    username: 'DesignAgency',
    email: 'hire@designagency.com',
    userType: 'employer',
    description: 'Design agency hiring creatives',
  },
  {
    name: 'AliceDev (Worker)',
    wallet: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    username: 'AliceDev',
    email: 'alice@developers.io',
    userType: 'worker',
    description: 'Full-stack developer',
  },
  {
    name: 'BobDesigner (Worker)',
    wallet: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
    username: 'BobDesigner',
    email: 'bob@creative.com',
    userType: 'worker',
    description: 'UI/UX Designer',
  },
  {
    name: 'CarolWriter (Worker)',
    wallet: '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
    username: 'CarolWriter',
    email: 'carol@wordsmith.io',
    userType: 'worker',
    description: 'Technical writer',
  },
]

export const DevModeProvider = ({ children }) => {
  const [isDevMode, setIsDevMode] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const { connectWallet } = useWallet()
  const { login } = useAuth()

  useEffect(() => {
    // Listen for Ctrl+Shift+D
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleDevMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDevMode])

  const toggleDevMode = () => {
    setIsDevMode((prev) => !prev)
    setShowDevPanel((prev) => !prev)
    
    if (!isDevMode) {
      toast.success('🔧 Dev Mode Activated', {
        duration: 2000,
        icon: '🚀',
      })
    } else {
      toast.success('Dev Mode Deactivated', {
        duration: 2000,
      })
    }
  }

  const switchToAccount = async (account) => {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        toast.error('MetaMask not installed!')
        return
      }

      // Request to switch to the account
      // Note: This will only work if the account is already imported in MetaMask
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      })

      toast.success(`Switching to ${account.name}...`, { duration: 2000 })
      
      // Give user instructions
      toast((t) => (
        <div className="text-sm">
          <p className="font-semibold mb-2">To use this demo account:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Import this private key in MetaMask</li>
            <li>Switch to the imported account</li>
            <li>Connect wallet in PayChain</li>
          </ol>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all">
            {getPrivateKeyForAccount(account.wallet)}
          </div>
          <p className="mt-2 text-xs text-red-600">
            ⚠️ Only use these keys on local Ganache testnet!
          </p>
        </div>
      ), {
        duration: 10000,
        style: { maxWidth: '500px' },
      })
      
    } catch (error) {
      console.error('Error switching account:', error)
      toast.error('Failed to switch account')
    }
  }

  // Ganache deterministic private keys (derived from mnemonic)
  const getPrivateKeyForAccount = (address) => {
    const keys = {
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
      '0x90f79bf6eb2c4f870365e785982e1f101e93b906': '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
      '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65': '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
      '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc': '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
    }
    return keys[address.toLowerCase()] || 'Unknown'
  }

  const value = {
    isDevMode,
    showDevPanel,
    demoAccounts: DEMO_ACCOUNTS,
    toggleDevMode,
    switchToAccount,
    setShowDevPanel,
  }

  return (
    <DevModeContext.Provider value={value}>
      {children}
    </DevModeContext.Provider>
  )
}
