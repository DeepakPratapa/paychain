import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateJobPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'development', // Default job type
    price: '',
    time_limit_hours: '',
    checklist: [],
  })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => jobService.createJob(data),
    onSuccess: (job) => {
      toast.success('Job created successfully!')
      navigate(`/jobs/${job.id}`)
    },
    onError: (error) => {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail) && detail[0]?.msg) {
        toast.error(detail[0].msg)
      } else {
        toast.error(detail || 'Failed to create job')
      }
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, newChecklistItem.trim()],
    }))
    setNewChecklistItem('')
  }

  const handleRemoveChecklistItem = (index) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (formData.title.trim().length < 5) {
      toast.error('Job title must be at least 5 characters')
      return
    }
    if (formData.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (!formData.time_limit_hours || parseInt(formData.time_limit_hours) <= 0) {
      toast.error('Please enter a valid time limit')
      return
    }

    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      job_type: formData.job_type,
      pay_amount_usd: parseFloat(formData.price),
      time_limit_hours: parseInt(formData.time_limit_hours),
      checklist: formData.checklist,
    })
  }

  if (user?.user_type !== 'employer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only employers can create jobs</p>
          <button
            onClick={() => navigate('/browse')}
            className="text-primary-600 hover:text-primary-700"
          >
            Browse available jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Create New Job Listing
          </h1>
          <p className="text-lg text-gray-600">
            Post your project and find talented workers
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Build a modern landing page for my SaaS startup"
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Minimum 5 characters</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your project in detail... Include requirements, deliverables, tech stack, design preferences, and any specific expectations."
              rows={6}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-2">Minimum 20 characters - be specific to attract the right talent</p>
          </div>

          {/* Job Type */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <label className="block text-sm font-semibold text-gray-800 mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 transition-all"
              required
            >
              <option value="development">💻 Development</option>
              <option value="design">🎨 Design</option>
              <option value="writing">✍️ Writing</option>
              <option value="marketing">📢 Marketing</option>
              <option value="other">🔧 Other</option>
            </select>
          </div>

          {/* Price and Time Limit */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 border border-green-100 hover:shadow-xl transition-shadow">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                💰 Payment (USD) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="100.00"
                  step="0.01"
                  min="10"
                  max="50000"
                  className="w-full pl-10 pr-5 py-3.5 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 placeholder-gray-400 font-semibold text-lg transition-all"
                  required
                />
              </div>
              <p className="text-xs text-green-700 mt-2 font-medium">
                💳 Locked in escrow • Min $10 • Max $50,000
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-100 hover:shadow-xl transition-shadow">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                ⏱️ Time Limit (hours) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="time_limit_hours"
                value={formData.time_limit_hours}
                onChange={handleChange}
                placeholder="48"
                min="1"
                className="w-full px-5 py-3.5 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 font-semibold text-lg transition-all"
                required
              />
              <p className="text-xs text-blue-700 mt-2 font-medium">
                ⏰ Deadline after worker accepts job
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              ✅ Task Checklist
            </label>
            <p className="text-sm text-gray-600 mb-5">
              Break down your project into specific milestones for better tracking and transparency
            </p>

            {/* Add checklist item */}
            <div className="flex space-x-3 mb-5">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddChecklistItem()
                  }
                }}
                placeholder="Add a milestone or task..."
                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 text-gray-900 placeholder-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Checklist items */}
            {formData.checklist.length > 0 && (
              <div className="space-y-3">
                {formData.checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-900 font-medium">{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {createMutation.isPending ? '✨ Creating...' : '🚀 Create Job & Lock Funds'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateJobPage
