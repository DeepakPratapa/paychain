import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWallet } from '../../contexts/WalletContext'
import { Wallet, LogOut, Home, Briefcase, PlusCircle } from 'lucide-react'
import RegistrationModal from '../auth/RegistrationModal'
import WalletBalance from '../wallet/WalletBalance'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, isAuthenticated, logout, login, signup } = useAuth()
  const { account, isConnected, connectWallet, disconnectWallet } = useWallet()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingWalletAddress, setPendingWalletAddress] = useState(null)

  const handleSignIn = async () => {
    // Connect wallet and check if user exists
    const address = await connectWallet()
    if (!address) return
    
    const result = await login()
    
    if (result?.needs_signup) {
      toast('New wallet detected. Redirecting to registration...', { icon: '👋' })
      // Show registration modal for new users
      setPendingWalletAddress(result.wallet_address || address)
      setShowRegistrationModal(true)
    }
  }

  const handleRegistrationSubmit = async (username, email, userType) => {
    const result = await signup(username, email, userType)
    
    if (result?.success) {
      setShowRegistrationModal(false)
      setPendingWalletAddress(null)
    }
  }

  const handleRegistrationClose = () => {
    setShowRegistrationModal(false)
    setPendingWalletAddress(null)
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <>
      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleRegistrationClose}
        onSubmit={handleRegistrationSubmit}
        walletAddress={pendingWalletAddress || account || ''}
      />

      <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">PayChain</span>
            </Link>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </Link>
              
              {/* Workers can browse jobs, employers cannot */}
              {user?.user_type === 'worker' && (
                <Link
                  to="/browse"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Briefcase size={18} />
                  <span>Browse Jobs</span>
                </Link>
              )}
              
              {user?.user_type === 'employer' && (
                <Link
                  to="/create-job"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <PlusCircle size={18} />
                  <span>Create Job</span>
                </Link>
              )}
            </div>
          )}

          {/* Wallet & User Info */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user && (
              <>
                {/* Wallet Balance */}
                <WalletBalance />
                
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.user_type}</div>
                  </div>
                  {isConnected && account && (
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-mono">
                      {formatAddress(account)}
                    </div>
                  )}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <Wallet size={18} />
                <span>Sign In</span>
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={() => {
                  logout()
                  disconnectWallet()
                }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}

export default Navbar
