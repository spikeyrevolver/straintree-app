import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from './config/api'

// Import components
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import StrainsPage from './pages/StrainsPage'
import FamilyTreesPage from './pages/FamilyTreesPage'
import FamilyTreeDetailPage from './pages/FamilyTreeDetailPage'
import AuthPage from './pages/AuthPage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.CHECK)
      
      if (response.ok) {
        const userData = await response.json()
        if (userData.authenticated && userData.user) {
          setUser(userData.user)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST'
      })
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading StrainTree...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strains" element={<StrainsPage />} />
            <Route path="/family-trees" element={<FamilyTreesPage />} />
            <Route path="/family-trees/:id" element={<FamilyTreeDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

