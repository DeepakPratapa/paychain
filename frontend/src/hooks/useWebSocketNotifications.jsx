import { useEffect, useRef } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook to handle WebSocket real-time notifications
 * Properly handles cleanup to work with React.StrictMode
 */
export const useWebSocketNotifications = () => {
  const { isConnected, subscribe, on } = useWebSocket()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const hasRegisteredHandlers = useRef(false)

  useEffect(() => {
    if (!isConnected || !user) return

    // Prevent duplicate handler registration
    if (hasRegisteredHandlers.current) {
      console.log('⚠️ Handlers already registered, skipping')
      return
    }

    console.log('✅ Registering WebSocket notification handlers for user:', user.id)
    hasRegisteredHandlers.current = true

    // Track if this effect is still active to prevent stale updates
    let isActive = true

    // Subscribe to relevant channels
    subscribe(['jobs', 'payments'])

    // ==================== JOB CREATED ====================
    const handleJobCreated = (data) => {
      if (!isActive) return // Prevent stale updates after cleanup
      
      // Only show toast to workers
      if (user?.user_type === 'worker') {
        toast.success(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">💼</div>
              <div>
                <div className="font-semibold text-white">New Job Posted!</div>
                <div className="text-sm text-indigo-100 mt-1">{data.title}</div>
                <div className="text-xs text-indigo-200 font-medium mt-1">
                  ${data.pay_amount_usd?.toLocaleString()} • {data.job_type}
                </div>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid #818cf8',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    }

    // ==================== JOB ACCEPTED ====================
    const handleJobAccepted = (data) => {
      if (!isActive) return

      // Only notify if this is the employer's job
      if (user?.user_type === 'employer') {
        toast.success(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div>
                <div className="font-semibold text-white">Job Accepted!</div>
                <div className="text-sm text-purple-100 mt-1">
                  A worker has accepted your job
                </div>
                <div className="text-xs text-purple-200 font-medium mt-1">
                  Job ID: #{data.job_id}
                </div>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
              border: '1px solid #c084fc',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['job', data.job_id] })
        queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    }

    // ==================== JOB COMPLETED ====================
    const handleJobCompleted = (data) => {
      if (!isActive) return

      if (user?.user_type === 'employer') {
        const message = data.payment_released
          ? 'Payment has been released to the worker'
          : 'Please review the completed work'

        toast.success(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎊</div>
              <div>
                <div className="font-semibold text-white">Job Completed!</div>
                <div className="text-sm text-cyan-100 mt-1">{message}</div>
                <div className="text-xs text-cyan-200 font-medium mt-1">
                  Job ID: #{data.job_id}
                </div>
              </div>
            </div>
          ),
          {
            duration: 7000,
            style: {
              background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
              border: '1px solid #22d3ee',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            },
          }
        )
      } else if (user?.user_type === 'worker') {
        toast.success(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="font-semibold text-white">Payment Released!</div>
                <div className="text-sm text-yellow-100 mt-1">
                  Your payment has been processed
                </div>
                <div className="text-xs text-yellow-200 font-medium mt-1">
                  Check your wallet for funds
                </div>
              </div>
            </div>
          ),
          {
            duration: 7000,
            style: {
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              border: '1px solid #facc15',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['job', data.job_id] })
        queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      }
    }

    // ==================== JOB REFUNDED ====================
    const handleJobRefunded = (data) => {
      if (!isActive) return

      if (user?.user_type === 'employer') {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔄</div>
              <div>
                <div className="font-semibold text-white">Job Refunded</div>
                <div className="text-sm text-blue-50 mt-1">
                  Your funds have been returned
                </div>
                <div className="text-xs text-blue-100 font-medium mt-1">
                  Reason: {data.reason || 'Job expired'}
                </div>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid #60a5fa',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['job', data.job_id] })
        queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
        queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      }
    }

    // ==================== JOB WITHDRAWN ====================
    const handleJobWithdrawn = (data) => {
      if (!isActive) return

      // Only notify the employer
      if (user?.user_type === 'employer') {
        const workerName = data.worker_username || 'A worker'
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-semibold text-white">Worker Withdrew</div>
                <div className="text-sm text-amber-50 mt-1">
                  {workerName} has withdrawn from
                </div>
                <div className="text-sm text-white font-medium mt-0.5">
                  "{data.job_title}"
                </div>
                <div className="text-xs text-amber-100 mt-1">
                  Job is now available for other workers
                </div>
              </div>
            </div>
          ),
          {
            duration: 7000,
            style: {
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: '1px solid #fbbf24',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['job', data.job_id] })
        queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    }

    // ==================== JOB REOPENED ====================
    const handleJobReopened = (data) => {
      if (!isActive) return

      // Notify all workers that a job is available again
      if (user?.user_type === 'worker') {
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="text-2xl">🔔</div>
              <div>
                <div className="font-semibold text-white">Job Available Again!</div>
                <div className="text-sm text-blue-50 mt-1">{data.title}</div>
                <div className="text-xs text-blue-100 font-medium mt-1">
                  ${data.pay_amount_usd?.toLocaleString()}
                </div>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: '1px solid #60a5fa',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            },
          }
        )
      }

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['jobs'] })
        queryClient.invalidateQueries({ queryKey: ['stats'] })
      }
    }

    // ==================== PAYMENT CONFIRMED ====================
    const handlePaymentConfirmed = (data) => {
      if (!isActive) return

      toast.success(
        (t) => (
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-semibold text-white">Payment Confirmed</div>
              <div className="text-sm text-teal-100 mt-1">
                Transaction completed successfully
              </div>
              {data.amount && (
                <div className="text-xs text-teal-200 font-medium mt-1">
                  Amount: ${data.amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ),
        {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            border: '1px solid #2dd4bf',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
          },
        }
      )

      if (isActive) {
        queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      }
    }

    // Register all handlers and store unsubscribe functions
    const unsubscribers = [
      on('job_created', handleJobCreated),
      on('job_accepted', handleJobAccepted),
      on('job_completed', handleJobCompleted),
      on('job_refunded', handleJobRefunded),
      on('job_withdrawn', handleJobWithdrawn),
      on('job_reopened', handleJobReopened),
      on('payment_confirmed', handlePaymentConfirmed),
    ]

    // Cleanup function - properly unsubscribe all handlers
    return () => {
      console.log('🧹 Cleaning up WebSocket notification handlers')
      isActive = false // Prevent any pending callbacks from executing
      hasRegisteredHandlers.current = false
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [isConnected, user, subscribe, on, queryClient])

  return { isConnected }
}
