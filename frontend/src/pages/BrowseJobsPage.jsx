import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import JobList from '../components/job/JobList'
import { Search } from 'lucide-react'

const BrowseJobsPage = () => {
  const [filters, setFilters] = useState({
    status: 'open',  // Always filter to open jobs only
    search: '',
    sort_by: 'newest',
  })

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
  })

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-1">
            Find available jobs and start earning
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <select
                value={filters.sort_by}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
        {Array.isArray(jobs) && !isLoading && (
          <div className="mb-4">
            <p className="text-gray-600">
              Found <span className="font-semibold">{jobs.length}</span> jobs
            </p>
          </div>
        )}

        {/* Jobs Grid */}
        <JobList
          jobs={jobs}
          loading={isLoading}
          emptyMessage="No jobs found matching your filters"
        />
      </div>
    </div>
  )
}

export default BrowseJobsPage
