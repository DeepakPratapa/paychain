import { useQuery } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import { useAuth } from '../contexts/AuthContext'
import JobList from '../components/job/JobList'
import PlatformStats from '../components/dashboard/PlatformStats'
import { Link } from 'react-router-dom'
import { PlusCircle, Briefcase, Clock, CheckCircle } from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()

  const { data: myJobs, isLoading: myJobsLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: jobService.getMyJobs,
  })

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const jobs = await jobService.getMyJobs()
      
      const totalJobs = jobs.length
      const activeJobs = jobs.filter(j => j.status === 'in_progress').length
      const completedJobs = jobs.filter(j => j.status === 'completed').length
      const totalEarned = jobs
        .filter(j => j.status === 'completed' && user.user_type === 'worker')
        .reduce((sum, j) => sum + parseFloat(j.pay_amount_eth || 0), 0)
      const totalSpent = jobs
        .filter(j => j.status === 'completed' && user.user_type === 'employer')
        .reduce((sum, j) => sum + parseFloat(j.pay_amount_eth || 0), 0)
      
      return {
        totalJobs,
        activeJobs,
        completedJobs,
        totalEarned,
        totalSpent,
      }
    },
    enabled: !!myJobs,
  })

  const isEmployer = user?.user_type === 'employer'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.username}!
            </p>
          </div>
          {isEmployer && (
            <Link
              to="/create-job"
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <PlusCircle size={20} />
              <span>Create New Job</span>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeJobs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedJobs || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {isEmployer ? 'Total Spent' : 'Total Earned'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {isEmployer 
                    ? (stats?.totalSpent || 0).toFixed(4)
                    : (stats?.totalEarned || 0).toFixed(4)
                  } ETH
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 text-xl font-bold">Ξ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEmployer ? 'My Posted Jobs' : 'My Accepted Jobs'}
                </h2>
                {!isEmployer && (
                  <Link to="/browse" className="text-primary-600 hover:text-primary-700 font-medium">
                    Browse All Jobs →
                  </Link>
                )}
              </div>
              
              <JobList
                jobs={myJobs}
                loading={myJobsLoading}
                emptyMessage={
                  isEmployer 
                    ? "You haven't posted any jobs yet. Create your first job to get started!"
                    : "You haven't accepted any jobs yet. Browse available jobs to get started!"
                }
              />
            </div>
          </div>

          {/* Platform Stats Sidebar */}
          <div className="lg:col-span-1">
            <PlatformStats />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
