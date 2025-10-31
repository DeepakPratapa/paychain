import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import { useAuth } from '../contexts/AuthContext'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EditJobPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'development',
    pay_amount_usd: '',
    time_limit_hours: '',
    checklist: [],
  })
  const [newChecklistItem, setNewChecklistItem] = useState('')

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
  })

  useEffect(() => {
    if (job) {
      if (job.employer_id !== user?.id) {
        toast.error('Only the creator can edit this job')
        navigate(`/jobs/${id}`)
        return
      }

      if (job.status !== 'open') {
        toast.error('Only open jobs can be edited')
        navigate(`/jobs/${id}`)
        return
      }

      setFormData({
        title: job.title,
        description: job.description,
        job_type: job.job_type,
        pay_amount_usd: job.pay_amount_usd,
        time_limit_hours: job.time_limit_hours,
        checklist: job.checklist.map((item) => item.text),
      })
    }
  }, [job, user?.id, navigate, id])

  const updateMutation = useMutation({
    mutationFn: (updates) => jobService.updateJob(id, updates),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries(['job', id])
      queryClient.invalidateQueries(['my-jobs'])
      toast.success('Job updated successfully')
      navigate(`/jobs/${updatedJob.id}`)
    },
    onError: (error) => {
      const detail = error.response?.data?.detail
      if (Array.isArray(detail) && detail[0]?.msg) {
        toast.error(detail[0].msg)
      } else {
        toast.error(detail || 'Failed to update job')
      }
    },
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    setFormData((prev) => ({
      ...prev,
      checklist: [...prev.checklist, newChecklistItem.trim()],
    }))
    setNewChecklistItem('')
  }

  const handleRemoveChecklistItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.title.trim().length < 5) {
      toast.error('Job title must be at least 5 characters')
      return
    }

    if (formData.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters')
      return
    }

    if (!formData.pay_amount_usd || parseFloat(formData.pay_amount_usd) < 10) {
      toast.error('Enter a valid payment amount (min $10)')
      return
    }

    if (!formData.time_limit_hours || parseInt(formData.time_limit_hours, 10) < 1) {
      toast.error('Enter a valid time limit (minimum 1 hour)')
      return
    }

    updateMutation.mutate({
      title: formData.title,
      description: formData.description,
      job_type: formData.job_type,
      pay_amount_usd: parseFloat(formData.pay_amount_usd),
      time_limit_hours: parseInt(formData.time_limit_hours, 10),
      checklist: formData.checklist,
    })
  }

  if (!isLoading && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
          <p className="text-gray-600 mt-1">
            Update details before a worker accepts your job
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Update the job title"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Update the job description"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Type *
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment (USD) *
              </label>
              <input
                type="number"
                name="pay_amount_usd"
                value={formData.pay_amount_usd}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="10"
                max="50000"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum $10, maximum $50,000</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (hours) *
              </label>
              <input
                type="number"
                name="time_limit_hours"
                value={formData.time_limit_hours}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-2">Deadline begins after acceptance</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Checklist
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Refresh the task list before hiring a worker. Items reset to incomplete on save.
            </p>

            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddChecklistItem()
                  }
                }}
                placeholder="Add a task"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {formData.checklist.length > 0 && (
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <span className="text-gray-900">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/jobs/${id}`)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditJobPage
