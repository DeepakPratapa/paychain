import { useState, useEffect } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { paymentService } from '../../services/paymentService'
import { Wallet, RefreshCw, ArrowLeftRight } from 'lucide-react'

const WalletBalance = () => {
  const { account } = useWallet()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showEth, setShowEth] = useState(true)

  const fetchBalance = async () => {
    if (!account) return

    setLoading(true)
    setError(null)

    try {
      const data = await paymentService.getBalance(account)
      setBalance(data)
    } catch (err) {
      console.error('Failed to fetch balance:', err)
      setError('Failed to load balance')
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    
    return () => clearInterval(interval)
  }, [account])

  if (!account) return null

  const handleToggleCurrency = (e) => {
    e.stopPropagation()
    setShowEth(!showEth)
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
          {error}
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
            onClick={fetchBalance}
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
