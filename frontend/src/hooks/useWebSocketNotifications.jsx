import { useEffect, useRef } from 'react'
import { useWebSocket } from '../contexts/WebSocketContext'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

/**
 * Custom hook to handle WebSocket real-time notifications
 * Properly handles cleanup and prevents duplicate toasts
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
      return
    }

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
          `💼 ${data.title} • $${data.pay_amount_usd?.toLocaleString()}`,
          {
            id: `job-created-${data.id}`,
            duration: 5000,
            style: {
              background: '#6366f1',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
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
        const workerName = data.worker_username || 'A worker'
        toast.success(
          `🎉 ${workerName} has accepted your job`,
          {
            id: `job-accepted-${data.job_id}`,
            duration: 6000,
            style: {
              background: '#a855f7',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
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
          ? '🎊 Payment released to worker'
          : '🎊 Job completed - please review'

        toast.success(
          message,
          {
            id: `job-completed-employer-${data.job_id}`,
            duration: 7000,
            style: {
              background: '#06b6d4',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
            },
          }
        )
      } else if (user?.user_type === 'worker') {
        toast.success(
          '💰 Payment released - check your wallet!',
          {
            id: `job-completed-worker-${data.job_id}`,
            duration: 7000,
            style: {
              background: '#eab308',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(234, 179, 8, 0.4)',
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
          `🔄 Job refunded - ${data.reason || 'Job expired'}`,
          {
            id: `job-refunded-${data.job_id}`,
            duration: 6000,
            style: {
              background: '#3b82f6',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
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
          `⚠️ ${workerName} withdrew from "${data.job_title}"`,
          {
            id: `job-withdrawn-${data.job_id}`,
            duration: 7000,
            style: {
              background: '#f59e0b',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.4)',
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
          `🔔 Job available again: ${data.title} • $${data.pay_amount_usd?.toLocaleString()}`,
          {
            id: `job-reopened-${data.id}`,
            duration: 5000,
            style: {
              background: '#3b82f6',
              color: '#ffffff',
              padding: '14px 16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
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

      const message = data.amount 
        ? `✅ Payment confirmed - $${data.amount.toLocaleString()}`
        : '✅ Payment confirmed'

      toast.success(
        message,
        {
          id: `payment-confirmed-${data.job_id || data.transaction_id || Date.now()}`,
          duration: 5000,
          style: {
            background: '#14b8a6',
            color: '#ffffff',
            padding: '14px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(20, 184, 166, 0.4)',
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
      isActive = false // Prevent any pending callbacks from executing
      hasRegisteredHandlers.current = false
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [isConnected, user, subscribe, on, queryClient])

  return { isConnected }
}
