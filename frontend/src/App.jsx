import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { WalletProvider } from './contexts/WalletContext'
import { DevModeProvider } from './contexts/DevModeContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import WebSocketNotifications from './components/WebSocketNotifications'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import BrowseJobsPage from './pages/BrowseJobsPage'
import JobDetailsPage from './pages/JobDetailsPage'
import CreateJobPage from './pages/CreateJobPage'
import EditJobPage from './pages/EditJobPage'
import Navbar from './components/layout/Navbar'
import DevModePanel from './components/dev/DevModePanel'

function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <WebSocketProvider>
          <DevModeProvider>
            {/* Global WebSocket notification handler */}
            <WebSocketNotifications />
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/browse" 
                  element={
                    <ProtectedRoute allowedRoles={['worker']}>
                      <BrowseJobsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/jobs/:id" 
                  element={
                    <ProtectedRoute>
                      <JobDetailsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/jobs/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['employer']}>
                      <EditJobPage />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/create-job" 
                  element={
                    <ProtectedRoute allowedRoles={['employer']}>
                      <CreateJobPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <DevModePanel />
            </div>
          </DevModeProvider>
        </WebSocketProvider>
      </AuthProvider>
    </WalletProvider>
  )
}

export default App
