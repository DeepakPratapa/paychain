import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { jobService } from '../services/jobService'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Clock, DollarSign, User, CheckCircle, AlertCircle, Pencil, Trash2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import CurrencyDisplay from '../components/common/CurrencyDisplay'

const JobDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  // Get WebSocket connection status (notifications handled globally in App.jsx)
  const { isConnected } = useWebSocket()

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id),
    staleTime: 5000, // Consider data fresh for 5 seconds
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  })

  // Note: WebSocket notifications are handled globally by useWebSocketNotifications hook
  // Real-time updates for job_created, job_accepted, job_completed, job_refunded

  const acceptMutation = useMutation({
    mutationFn: () => jobService.acceptJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id])
      queryClient.invalidateQueries(['my-jobs'])
      toast.success('Job accepted successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to accept job')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: () => jobService.withdrawFromJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['job', id])
      queryClient.invalidateQueries(['my-jobs'])
      queryClient.invalidateQueries(['jobs'])
      toast.success('You have withdrawn from this job. The employer has been notified.')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to withdraw from job')
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => jobService.completeJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries(['job', id])
      queryClient.invalidateQueries(['my-jobs'])
      toast.success('Work submitted! Escrow release initiated.')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to complete job')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => jobService.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries(['my-jobs'])
      toast.success('Job cancelled successfully')
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to cancel job')
    },
  })

  const handleDeleteJob = () => {
    if (deleteMutation.isPending) return
    const confirmed = window.confirm('Are you sure you want to cancel this job? This action cannot be undone.')
    if (confirmed) {
      deleteMutation.mutate()
    }
  }

  const handleWithdrawFromJob = () => {
    if (withdrawMutation.isPending) return
    const confirmed = window.confirm(
      'Are you sure you want to withdraw from this job? The job will be reopened for other workers, and the employer will be notified.'
    )
    if (confirmed) {
      withdrawMutation.mutate()
    }
  }

  const checklistMutation = useMutation({
    mutationFn: ({ itemId, completed }) => jobService.updateChecklist(id, itemId, completed),
    onMutate: async ({ itemId, completed }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['job', id], exact: true })
      
      // Snapshot the previous value
      const previousJob = queryClient.getQueryData(['job', id])

      // Optimistically update the cache
      if (previousJob) {
        const updated = {
          ...previousJob,
          checklist: previousJob.checklist.map((item) =>
            item.id === itemId ? { ...item, completed } : item
          ),
        }
        queryClient.setQueryData(['job', id], updated)
      }

      return { previousJob }
    },
    onSuccess: (data) => {
      // Update cache with actual server response to ensure sync
      const currentJob = queryClient.getQueryData(['job', id])
      if (currentJob && data.checklist) {
        queryClient.setQueryData(['job', id], {
          ...currentJob,
          checklist: data.checklist,
        })
      }
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousJob) {
        queryClient.setQueryData(['job', id], context.previousJob)
      }
      toast.error(error.response?.data?.detail || 'Failed to update checklist')
    },
  })

  const handleChecklistToggle = (itemId, completed) => {
    // Prevent multiple simultaneous updates
    if (checklistMutation.isPending) return
    
    checklistMutation.mutate({
      itemId,
      completed: !completed,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job not found</h2>
          <button
            onClick={() => navigate('/browse')}
            className="text-primary-600 hover:text-primary-700"
          >
            Browse other jobs
          </button>
        </div>
      </div>
    )
  }

  const isEmployer = user?.id === job.employer_id
  const isWorker = user?.id === job.worker_id
  const isJobOpen = job.status === 'open'
  const isJobInProgress = job.status === 'in_progress'
  const canAccept = user?.user_type === 'worker' && isJobOpen && !isEmployer
  const canWithdraw = isWorker && isJobInProgress
  const canUpdateChecklist = isWorker && job.status === 'in_progress'
  const totalTasks = Array.isArray(job.checklist) ? job.checklist.length : 0
  const completedTasks = Array.isArray(job.checklist)
    ? job.checklist.filter((item) => item.completed).length
    : 0
  const progressPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
  const canSubmitWork = isWorker && job.status === 'in_progress'
  const isReadyToSubmit = canSubmitWork && (totalTasks === 0 || completedTasks === totalTasks)
  const canManageJob = isEmployer && isJobOpen

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '$0.00'
    return `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatEth = (eth) => {
    if (!eth || isNaN(eth)) return '0.0000 ETH'
    return `${parseFloat(eth).toFixed(4)} ETH`
  }

  const getStatusText = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}>
                {getStatusText(job.status)}
              </span>
            </div>
            <div className="text-right">
              <CurrencyDisplay 
                amountUsd={job.pay_amount_usd}
                amountEth={job.pay_amount_eth}
                className="text-3xl text-primary-600"
              />
              <p className="text-sm text-gray-500 mt-2">Payment</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div className="flex items-center text-gray-700">
              <User size={20} className="mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Employer</p>
                <p className="font-medium">{job.employer_username || 'Employer'}</p>
              </div>
            </div>

            {job.worker_username && (
              <div className="flex items-center text-gray-700">
                <CheckCircle size={20} className="mr-2 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Worker</p>
                  <p className="font-medium">{job.worker_username}</p>
                </div>
              </div>
            )}

            <div className="flex items-center text-gray-700">
              <Clock size={20} className="mr-2 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Time Limit</p>
                <p className="font-medium">{job.time_limit_hours} hours</p>
              </div>
            </div>

            {job.deadline && (
              <div className="flex items-center text-gray-700">
                <AlertCircle size={20} className="mr-2 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="font-medium">{formatDate(job.deadline)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Checklist */}
        {job.checklist && job.checklist.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Task Checklist</h2>
            <div className="space-y-3">
              {job.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 ${
                    item.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  } ${canUpdateChecklist ? 'hover:shadow-sm hover:border-primary-200' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleChecklistToggle(item.id, item.completed)}
                    disabled={!canUpdateChecklist}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${item.completed ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                      {item.text}
                    </p>
                    {canUpdateChecklist && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.completed ? 'Completed' : 'Mark complete to track progress'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600">
                    <ClipboardList size={20} />
                  </span>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-base font-semibold text-gray-900">
                      {completedTasks} / {totalTasks} tasks completed
                    </p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-500 mt-1">{progressPercent}% complete</p>
                </div>
              </div>
              {canSubmitWork && !isReadyToSubmit && (
                <p className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  Complete all tasks to submit work for payment.
                </p>
              )}
              {isReadyToSubmit && (
                <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center space-x-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>All tasks completed. Submit your work when ready.</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>

          <div className="space-y-4">
            {canAccept && (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {acceptMutation.isPending ? 'Accepting…' : 'Accept This Job'}
              </button>
            )}

            {canSubmitWork && (
              <button
                onClick={() => completeMutation.mutate()}
                disabled={!isReadyToSubmit || completeMutation.isPending}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  isReadyToSubmit
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {completeMutation.isPending ? 'Submitting…' : 'Submit Work & Release Payment'}
              </button>
            )}

            {canWithdraw && (
              <button
                onClick={handleWithdrawFromJob}
                disabled={withdrawMutation.isPending}
                className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {withdrawMutation.isPending ? 'Withdrawing…' : 'Withdraw from Job'}
              </button>
            )}

            {canManageJob && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Link
                  to={`/jobs/${job.id}/edit`}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  <Pencil size={18} />
                  <span>Edit Job</span>
                </Link>
                <button
                  onClick={handleDeleteJob}
                  disabled={deleteMutation.isPending}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  <span>{deleteMutation.isPending ? 'Cancelling…' : 'Cancel Job'}</span>
                </button>
              </div>
            )}

            {!canAccept && !canSubmitWork && !canManageJob && (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  {isEmployer ? 'You created this job' :
                    isWorker ? 'You are working on this job' :
                    'This job is not available'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetailsPage
