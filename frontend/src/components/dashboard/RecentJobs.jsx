import { Link } from 'react-router-dom'
import { Clock, DollarSign, User, CheckCircle, AlertCircle } from 'lucide-react'
import CurrencyDisplay from '../common/CurrencyDisplay'

const RecentJobs = ({ jobs, title, emptyMessage, isEmployer }) => {
  const getStatusBadge = (status) => {
    const badges = {
      open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
      submitted: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Submitted' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    }
    return badges[status] || badges.open
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
        <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
      <div className="space-y-4">
        {jobs.slice(0, 5).map((job) => {
          const statusBadge = getStatusBadge(job.status)
          return (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block p-5 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-900 text-lg flex-1 mr-4">
                  {job.title}
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className="text-green-600" />
                  <CurrencyDisplay 
                    amountUsd={job.pay_amount_usd}
                    amountEth={job.pay_amount_eth}
                    className="font-semibold"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-blue-600" />
                  <span>{job.time_limit_hours}h</span>
                </div>
                {!isEmployer && job.employer_username && (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-purple-600" />
                    <span>{job.employer_username}</span>
                  </div>
                )}
                {isEmployer && job.worker_username && (
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-purple-600" />
                    <span>{job.worker_username}</span>
                  </div>
                )}
              </div>
              {job.checklist && job.checklist.length > 0 && (
                <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                  <CheckCircle size={14} />
                  <span>
                    {job.checklist.filter(item => item.completed).length} / {job.checklist.length} tasks completed
                  </span>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default RecentJobs
