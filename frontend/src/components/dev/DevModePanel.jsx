import { useDevMode } from '../../contexts/DevModeContext'
import { X, User, Briefcase, Code } from 'lucide-react'

const DevModePanel = () => {
  const { showDevPanel, setShowDevPanel, demoAccounts, switchToAccount } = useDevMode()

  if (!showDevPanel) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl w-80 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-500 text-gray-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code size={20} />
            <span className="font-bold">Dev Mode</span>
          </div>
          <button
            onClick={() => setShowDevPanel(false)}
            className="text-gray-900 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-gray-400 mb-3">
            Quick switch between preconfigured demo accounts
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {demoAccounts.map((account) => (
              <button
                key={account.wallet}
                onClick={() => switchToAccount(account)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 text-left transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    account.userType === 'employer' 
                      ? 'bg-purple-500' 
                      : 'bg-blue-500'
                  }`}>
                    {account.userType === 'employer' ? (
                      <Briefcase size={16} />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm truncate">
                        {account.username}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        account.userType === 'employer'
                          ? 'bg-purple-900 text-purple-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}>
                        {account.userType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">
                      {account.description}
                    </p>
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {account.wallet.substring(0, 10)}...{account.wallet.substring(account.wallet.length - 8)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-yellow-400 flex items-center space-x-1">
              <span>⚠️</span>
              <span>Press Ctrl+Shift+D to toggle</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Click an account to get import instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DevModePanel
