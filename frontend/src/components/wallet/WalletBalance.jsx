import { useState } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { paymentService } from '../../services/paymentService'
import { Wallet, RefreshCw, ArrowLeftRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const WalletBalance = () => {
  const { account } = useWallet()
  const [showEth, setShowEth] = useState(true)

  // Use React Query for balance so WebSocket can invalidate it
  const { data: balance, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['wallet-balance', account],
    queryFn: () => paymentService.getBalance(account),
    enabled: !!account,
    refetchInterval: 30000, // Refresh every 30 seconds as fallback
    staleTime: 10000, // Consider data stale after 10 seconds
  })

  if (!account) return null

  const handleToggleCurrency = (e) => {
    e.stopPropagation()
    setShowEth(!showEth)
  }

  const handleRefresh = (e) => {
    e.stopPropagation()
    refetch()
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-200 rounded-lg">
      <Wallet className="w-4 h-4 text-primary-600" />
      
      {loading && !balance ? (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">
          Failed to load balance
        </div>
      ) : balance ? (
        <div className="flex items-center gap-2">
          {showEth ? (
            <span className="text-sm font-semibold text-gray-800">
              {(() => {
                const eth = parseFloat(balance.balance_eth || 0)
                return !isNaN(eth) ? eth.toFixed(4) : '0.0000'
              })()} ETH
            </span>
          ) : (
            <span className="text-sm font-semibold text-gray-800">
              ${(() => {
                const usd = parseFloat(balance.balance_usd || 0)
                return !isNaN(usd) ? usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'
              })()}
            </span>
          )}
          <button
            onClick={handleToggleCurrency}
            className="p-1 hover:bg-primary-100 rounded transition-colors group"
            title={showEth ? "Show USD" : "Show ETH"}
          >
            <ArrowLeftRight className="w-3 h-3 text-primary-600 group-hover:text-primary-700 transition-colors" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 hover:bg-primary-100 rounded transition-colors disabled:opacity-50"
            title="Refresh balance"
          >
            <RefreshCw className={`w-3 h-3 text-primary-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default WalletBalance
