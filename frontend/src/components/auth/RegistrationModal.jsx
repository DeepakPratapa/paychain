import { useState } from 'react'
import { X, User, Mail, Briefcase, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const RegistrationModal = ({ isOpen, onClose, onSubmit, walletAddress }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    userType: 'worker',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters')
      return
    }
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData.username, formData.email, formData.userType)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-primary-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Complete Your Registration
          </h2>
          <p className="text-gray-600 text-sm">
            Welcome to PayChain! Please complete your profile to get started.
          </p>
        </div>

        {/* Connected Wallet */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-green-600 font-medium mb-1">Connected Wallet</p>
          <p className="text-sm text-green-800 font-mono break-all">{walletAddress}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="johndoe"
                required
                minLength={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="john@example.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* User Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'worker' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.userType === 'worker'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={isSubmitting}
              >
                <UserCheck className={`mx-auto mb-2 ${
                  formData.userType === 'worker' ? 'text-primary-600' : 'text-gray-400'
                }`} size={24} />
                <p className={`text-sm font-medium ${
                  formData.userType === 'worker' ? 'text-primary-600' : 'text-gray-700'
                }`}>
                  Find Work
                </p>
                <p className="text-xs text-gray-500 mt-1">Worker</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, userType: 'employer' })}
                className={`p-4 border-2 rounded-lg transition-all ${
                  formData.userType === 'employer'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                disabled={isSubmitting}
              >
                <Briefcase className={`mx-auto mb-2 ${
                  formData.userType === 'employer' ? 'text-primary-600' : 'text-gray-400'
                }`} size={24} />
                <p className={`text-sm font-medium ${
                  formData.userType === 'employer' ? 'text-primary-600' : 'text-gray-700'
                }`}>
                  Hire Talent
                </p>
                <p className="text-xs text-gray-500 mt-1">Employer</p>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default RegistrationModal
