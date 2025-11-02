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
          <div>
            <div className="font-semibold">New Job Posted!</div>
            <div className="text-sm">{data.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              ${data.pay_amount_usd?.toLocaleString()} • {data.job_type}
            </div>
          </div>,
          {
            duration: 5000,
            icon: '💼',
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
          <div>
            <div className="font-semibold">Job Accepted!</div>
            <div className="text-sm">A worker has accepted your job</div>
            <div className="text-xs text-gray-500 mt-1">
              Job ID: {data.job_id}
            </div>
          </div>,
          {
            duration: 6000,
            icon: '🎉',
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
          <div>
            <div className="font-semibold">Job Completed!</div>
            <div className="text-sm">{message}</div>
            <div className="text-xs text-gray-500 mt-1">
              Job ID: {data.job_id}
            </div>
          </div>,
          {
            duration: 7000,
            icon: '🎊',
          }
        )
      } else if (user?.user_type === 'worker') {
        toast.success(
          <div>
            <div className="font-semibold">Payment Released!</div>
            <div className="text-sm">Your payment has been processed</div>
            <div className="text-xs text-gray-500 mt-1">
              Check your wallet
            </div>
          </div>,
          {
            duration: 7000,
            icon: '💰',
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
          <div>
            <div className="font-semibold">Job Refunded</div>
            <div className="text-sm">Your funds have been returned</div>
            <div className="text-xs text-gray-500 mt-1">
              Reason: {data.reason || 'Job expired'}
            </div>
          </div>,
          {
            duration: 6000,
            icon: '🔄',
            style: {
              background: '#3b82f6',
              color: '#fff',
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
        toast(
          <div>
            <div className="font-semibold">Worker Withdrew from Job</div>
            <div className="text-sm">{data.worker_username} has withdrawn from "{data.job_title}"</div>
            <div className="text-xs text-gray-500 mt-1">
              Job is now available for other workers
            </div>
          </div>,
          {
            duration: 7000,
            icon: '⚠️',
            style: {
              background: '#f59e0b',
              color: '#fff',
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
          <div>
            <div className="font-semibold">Job Available Again!</div>
            <div className="text-sm">{data.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              ${data.pay_amount_usd?.toLocaleString()}
            </div>
          </div>,
          {
            duration: 5000,
            icon: '🔔',
            style: {
              background: '#3b82f6',
              color: '#fff',
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
        <div>
          <div className="font-semibold">Payment Confirmed</div>
          <div className="text-sm">Transaction completed</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.amount ? `$${data.amount.toLocaleString()}` : ''}
          </div>
        </div>,
        {
          duration: 5000,
          icon: '✅',
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
