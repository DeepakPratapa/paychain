import { Link } from 'react-router-dom'
import { DollarSign, Clock, Sparkles, TrendingUp } from 'lucide-react'

const JobRecommendations = ({ jobs }) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
        <Sparkles className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-600">No job recommendations available at the moment</p>
        <Link to="/browse" className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium">
          Browse all jobs →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-8 border border-purple-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="text-purple-600" size={24} />
        <h3 className="text-xl font-bold text-gray-900">Recommended For You</h3>
      </div>
      <div className="space-y-4">
        {jobs.slice(0, 4).map((job) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="block p-5 bg-white rounded-xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-gray-900 text-lg flex-1 mr-4">
                {job.title}
              </h4>
              {parseFloat(job.pay_amount_usd) >= 100 && (
                <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  <TrendingUp size={14} />
                  <span>High Pay</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {job.description}
            </p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center space-x-1 text-green-700 font-bold">
                <DollarSign size={16} />
                <span>${job.pay_amount_usd}</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-700 font-medium">
                <Clock size={16} />
                <span>{job.time_limit_hours}h</span>
              </div>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                {job.job_type}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <Link
        to="/browse"
        className="block mt-6 text-center px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
      >
        Browse All Jobs →
      </Link>
    </div>
  )
}

export default JobRecommendations
