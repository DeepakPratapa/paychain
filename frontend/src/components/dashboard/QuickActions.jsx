import { Link } from 'react-router-dom'

const QuickActions = ({ actions }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-6">⚡ Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.to}
            className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${
              action.primary
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white border-primary-600 hover:from-primary-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <action.icon size={24} />
            <span className="font-semibold">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default QuickActions
