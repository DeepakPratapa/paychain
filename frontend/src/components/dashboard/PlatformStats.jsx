import { useState, useEffect } from 'react'
import { paymentService } from '../../services/paymentService'
import { TrendingUp, DollarSign, Users, Activity } from 'lucide-react'

const PlatformStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await paymentService.getEscrowStats()
        setStats(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch platform stats:', err)
        setError('Failed to load platform statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          Platform Statistics
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return null // Silently fail - optional feature
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary-600" />
        Platform Statistics
      </h3>
      
      <div className="space-y-4">
        {/* Total Jobs */}
        {stats.total_jobs !== undefined && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_jobs}</p>
              </div>
            </div>
          </div>
        )}

        {/* Total Volume */}
        {stats.total_volume_eth !== undefined && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-green-600">
                  {(() => {
                    const eth = parseFloat(stats.total_volume_eth || 0)
                    return !isNaN(eth) ? eth.toFixed(2) : '0.00'
                  })()} ETH
                </p>
                {stats.total_volume_usd && (
                  <p className="text-xs text-gray-500">
                    ~${(() => {
                      const usd = parseFloat(stats.total_volume_usd || 0)
                      return !isNaN(usd) ? usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Platform Fees */}
        {stats.platform_fees_eth !== undefined && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform Fees</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const eth = parseFloat(stats.platform_fees_eth || 0)
                    return !isNaN(eth) ? eth.toFixed(4) : '0.0000'
                  })()} ETH
                </p>
                {stats.platform_fees_usd && (
                  <p className="text-xs text-gray-500">
                    ~${(() => {
                      const usd = parseFloat(stats.platform_fees_usd || 0)
                      return !isNaN(usd) ? usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlatformStats
