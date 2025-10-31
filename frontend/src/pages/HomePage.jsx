import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Shield, Zap, TrendingUp, PlusCircle, Search } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'
import { useQuery } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import RegistrationModal from '../components/auth/RegistrationModal'
import StatsCard from '../components/dashboard/StatsCard'
import QuickActions from '../components/dashboard/QuickActions'
import RecentJobs from '../components/dashboard/RecentJobs'
import JobRecommendations from '../components/dashboard/JobRecommendations'
import toast from 'react-hot-toast'

const HomePage = () => {
  const navigate = useNavigate()
  const { isAuthenticated, login, signup, user } = useAuth()
  const { isConnected, connectWallet, account } = useWallet()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingWalletAddress, setPendingWalletAddress] = useState(null)

  // Fetch user's jobs if authenticated
  const { data: myJobs } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: jobService.getMyJobs,
    enabled: isAuthenticated,
  })

  // Fetch open jobs for workers
  const { data: openJobs } = useQuery({
    queryKey: ['open-jobs'],
    queryFn: () => jobService.getJobs({ status: 'open', sort_by: 'pay_high' }),
    enabled: isAuthenticated && user?.user_type === 'worker',
  })

  const handleGetStarted = async () => {
    const address = await connectWallet()
    if (!address) {
      toast.error('Failed to connect wallet')
      return
    }

    const result = await login()
    
    if (result?.needs_signup) {
      toast('New wallet detected. Redirecting to registration...', { icon: '👋' })
      setPendingWalletAddress(result.wallet_address || address)
      setShowRegistrationModal(true)
    } else if (result?.success) {
      toast.success('User already registered, signing in...', { icon: '✅' })
      navigate('/dashboard')
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

  // Calculate stats for authenticated users
  const stats = myJobs ? {
    totalJobs: myJobs.length,
    activeJobs: myJobs.filter(j => j.status === 'in_progress').length,
    completedJobs: myJobs.filter(j => j.status === 'completed').length,
    totalEarned: myJobs
      .filter(j => j.status === 'completed' && user?.user_type === 'worker')
      .reduce((sum, j) => sum + parseFloat(j.pay_amount_usd || 0), 0),
    totalSpent: myJobs
      .filter(j => j.status === 'completed' && user?.user_type === 'employer')
      .reduce((sum, j) => sum + parseFloat(j.pay_amount_usd || 0), 0),
  } : null

  const isEmployer = user?.user_type === 'employer'

  // Render authenticated employer view
  if (isAuthenticated && isEmployer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user.username}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Manage your jobs and find talented workers
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Briefcase}
              label="Total Jobs Posted"
              value={stats?.totalJobs || 0}
              color="blue"
            />
            <StatsCard
              icon={Zap}
              label="Active Jobs"
              value={stats?.activeJobs || 0}
              color="yellow"
            />
            <StatsCard
              icon={Shield}
              label="Completed Jobs"
              value={stats?.completedJobs || 0}
              color="green"
            />
            <StatsCard
              icon={TrendingUp}
              label="Total Spent"
              value={`$${stats?.totalSpent.toFixed(2) || '0.00'}`}
              color="purple"
              subtext="USD"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Jobs - 2 columns */}
            <div className="lg:col-span-2">
              <RecentJobs
                jobs={myJobs}
                title="📋 Your Recent Jobs"
                emptyMessage="You haven't posted any jobs yet. Create your first job to get started!"
                isEmployer={true}
              />
            </div>

            {/* Quick Actions - 1 column */}
            <div className="space-y-6">
              <QuickActions
                actions={[
                  {
                    icon: PlusCircle,
                    label: 'Create New Job',
                    to: '/create-job',
                    primary: true,
                  },
                  {
                    icon: Briefcase,
                    label: 'All My Jobs',
                    to: '/dashboard',
                    primary: false,
                  },
                ]}
              />

              {/* Platform Stats */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border border-green-100 hover:shadow-xl transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-4">💼 Platform Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Open Jobs</span>
                    <span className="text-2xl font-bold text-green-600">
                      {openJobs?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Your Success Rate</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {stats?.completedJobs > 0
                        ? Math.round((stats.completedJobs / stats.totalJobs) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render authenticated worker view
  if (isAuthenticated && !isEmployer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back, {user.username}! 🚀
            </h1>
            <p className="text-lg text-gray-600">
              Find new opportunities and grow your earnings
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              icon={Briefcase}
              label="Jobs Accepted"
              value={stats?.totalJobs || 0}
              color="blue"
            />
            <StatsCard
              icon={Zap}
              label="In Progress"
              value={stats?.activeJobs || 0}
              color="yellow"
            />
            <StatsCard
              icon={Shield}
              label="Completed"
              value={stats?.completedJobs || 0}
              color="green"
            />
            <StatsCard
              icon={TrendingUp}
              label="Total Earned"
              value={`$${stats?.totalEarned.toFixed(2) || '0.00'}`}
              color="purple"
              subtext="USD"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Job Recommendations - 2 columns */}
            <div className="lg:col-span-2">
              <JobRecommendations jobs={openJobs} />
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              <QuickActions
                actions={[
                  {
                    icon: Search,
                    label: 'Browse All Jobs',
                    to: '/browse',
                    primary: true,
                  },
                  {
                    icon: Briefcase,
                    label: 'My Active Jobs',
                    to: '/dashboard',
                    primary: false,
                  },
                ]}
              />

              {/* Recent Activity */}
              <RecentJobs
                jobs={myJobs}
                title="⚡ Your Recent Work"
                emptyMessage="No jobs yet. Start browsing to find opportunities!"
                isEmployer={false}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render unauthenticated view (original marketing page)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
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
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-lg shadow-lg hover:shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features Section */}
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
    </div>
  )
}

export default HomePage
