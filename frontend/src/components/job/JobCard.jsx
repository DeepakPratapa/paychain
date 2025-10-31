import { Clock, DollarSign, User, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const JobCard = ({ job }) => {
  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00'
    return `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusText = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <Link to={`/jobs/${job.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {job.title}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[job.status]}`}>
            {getStatusText(job.status)}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">
          {job.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center text-sm text-gray-700">
            <DollarSign size={16} className="mr-2 text-gray-400" />
            <span className="font-semibold text-primary-600">{formatPrice(job.pay_amount_usd)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="mr-2 text-gray-400" />
            <span>Time limit: {job.time_limit_hours}h</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <User size={16} className="mr-2 text-gray-400" />
            <span>Employer: {job.employer_username || 'Unknown'}</span>
          </div>

          {job.worker_username && (
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle size={16} className="mr-2 text-gray-400" />
              <span>Worker: {job.worker_username}</span>
            </div>
          )}

          {job.deadline && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2 text-gray-400" />
              <span>Deadline: {formatDate(job.deadline)}</span>
            </div>
          )}
        </div>

        {/* Checklist Progress */}
        {job.checklist && job.checklist.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {job.checklist.filter(item => item.completed).length} / {job.checklist.length}
              </span>
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(job.checklist.filter(item => item.completed).length / job.checklist.length) * 100}%`
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

export default JobCard
