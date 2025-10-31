import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'

const CurrencyDisplay = ({ amountUsd, amountEth, className = '', showToggle = true }) => {
  const [showEth, setShowEth] = useState(false)
  
  const usd = parseFloat(amountUsd || 0)
  const eth = parseFloat(amountEth || 0)
  
  const handleToggle = (e) => {
    e.stopPropagation()
    setShowEth(!showEth)
  }
  
  if (!showToggle) {
    return (
      <span className={className}>
        ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    )
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold">
        {showEth ? (
          <>
            {eth.toFixed(4)} ETH
          </>
        ) : (
          <>
            ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </>
        )}
      </span>
      <button
        onClick={handleToggle}
        className="p-1 hover:bg-gray-100 rounded transition-colors group"
        title={showEth ? "Show USD" : "Show ETH"}
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-600 transition-colors" />
      </button>
    </div>
  )
}

export default CurrencyDisplay
