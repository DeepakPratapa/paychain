import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import { useWebSocket } from '../contexts/WebSocketContext'
import JobList from '../components/job/JobList'
import { Search, Wifi, WifiOff } from 'lucide-react'

const BrowseJobsPage = () => {
  const { isConnected } = useWebSocket()
  const [filters, setFilters] = useState({
    status: 'open',  // Always filter to open jobs only
    search: '',
    sort_by: 'newest',
  })

  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
  })

  // Extract jobs array and metadata from paginated response
  const jobs = jobsResponse?.jobs || jobsResponse
  const total = jobsResponse?.total || (Array.isArray(jobs) ? jobs.length : 0)
  const pages = jobsResponse?.pages || 0

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleSortChange = (sort_by) => {
    setFilters(prev => ({ ...prev, sort_by }))
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'pay_high', label: 'Highest Pay' },
    { value: 'pay_low', label: 'Lowest Pay' },
    { value: 'title', label: 'Alphabetical' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Browse Available Jobs
          </h1>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            Find your next opportunity • {total || 0} jobs available
            {/* WebSocket Connection Indicator */}
            <span className="inline-flex items-center gap-1 text-sm ml-2">
              {isConnected ? (
                <>
                  <Wifi size={16} className="text-green-600" />
                  <span className="text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-gray-400" />
                  <span className="text-gray-400">Offline</span>
                </>
              )}
            </span>
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                🔍 Search Jobs
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title, description, category..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full pl-12 pr-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="md:w-64">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                📊 Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 transition-all font-medium"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && total > 0 && (
          <div className="mb-6 bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4 border border-primary-100">
            <p className="text-gray-700 font-medium text-center">
              ✨ Found <span className="font-bold text-primary-600">{total}</span> available job{total !== 1 ? 's' : ''}
              {pages > 1 && <span className="text-gray-600"> ({pages} page{pages !== 1 ? 's' : ''})</span>}
            </p>
          </div>
        )}

        {/* Jobs Grid */}
        <JobList
          jobs={jobs}
          loading={isLoading}
          emptyMessage="No jobs found matching your filters. Try adjusting your search criteria."
        />
      </div>
    </div>
  )
}

export default BrowseJobsPage
