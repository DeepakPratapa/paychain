import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Shield, Zap, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'
import RegistrationModal from '../components/auth/RegistrationModal'
import toast from 'react-hot-toast'

const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, login, signup, user } = useAuth()
  const { isConnected, connectWallet, account } = useWallet()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingWalletAddress, setPendingWalletAddress] = useState(null)

  const handleGetStarted = async () => {
    // For new users - connect wallet and check registration
    const address = await connectWallet()
    if (!address) {
      toast.error('Failed to connect wallet')
      return
    }

    // Check if wallet is already registered
    const result = await login()
    
    if (result?.needs_signup) {
      // Show registration modal for new users
      toast('New wallet detected. Redirecting to registration...', { icon: '👋' })
      setPendingWalletAddress(result.wallet_address || address)
      setShowRegistrationModal(true)
    } else if (result?.success) {
      // Wallet already registered - show message and redirect
      toast.success('User already registered, signing in...', { icon: '✅' })
      navigate('/dashboard')
    }
  }

  const handleRegistrationSubmit = async (username, email, userType) => {
    const result = await signup(username, email, userType)
    
    if (result?.success) {
      setShowRegistrationModal(false)
      setPendingWalletAddress(null)
    } else if (result?.error) {
      // Error is already toasted by signup function
      // Keep modal open for user to correct
    }
  }

  const handleRegistrationClose = () => {
    setShowRegistrationModal(false)
    setPendingWalletAddress(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={handleRegistrationClose}
        onSubmit={handleRegistrationSubmit}
        walletAddress={pendingWalletAddress || account || ''}
      />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Freelance Payments
            <span className="block text-primary-600">On The Blockchain</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            PayChain revolutionizes the gig economy with blockchain-powered escrow. 
            Work with confidence, get paid securely.
          </p>
          <div className="flex justify-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
                {user?.user_type === 'worker' && (
                  <Link
                    to="/browse"
                    className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Browse Jobs
                  </Link>
                )}
                {user?.user_type === 'employer' && (
                  <Link
                    to="/create-job"
                    className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    Post a Job
                  </Link>
                )}
              </>
            ) : (
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Features Section - Only show to unauthenticated users */}
      {!isAuthenticated && (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose PayChain?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Secure Escrow
                </h3>
                <p className="text-gray-600">
                  Funds locked in smart contracts until job completion. No disputes, no chargebacks.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Instant Releases
                </h3>
                <p className="text-gray-600">
                  Payments released automatically to workers upon job approval. Fast and fair.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Task Management
                </h3>
                <p className="text-gray-600">
                  Built-in checklists and progress tracking. Everyone stays on the same page.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-primary-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Transparent Fees
                </h3>
                <p className="text-gray-600">
                  Just 2% platform fee. No hidden charges. Blockchain transparency you can trust.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Create or Accept Job
                  </h3>
                  <p className="text-gray-600">
                    Employers post jobs with escrow. Workers browse and accept tasks that match their skills.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Complete Work
                  </h3>
                  <p className="text-gray-600">
                    Track progress with built-in checklists. Submit work when complete for employer review.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Get Paid
                  </h3>
                  <p className="text-gray-600">
                    Employer approves, smart contract releases payment. Instant, secure, guaranteed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-primary-600 rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Connect your wallet and join the future of freelancing
              </p>
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default HomePage
