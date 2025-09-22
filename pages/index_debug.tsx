import React from 'react'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContextFirebase'

export default function Home() {
  const authData = useAuth()
  
  console.log('Home render - isLoading:', authData.isLoading, 'isAuth:', authData.isAuthenticated)
  
  if (authData.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl text-white">💊</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authData.isAuthenticated) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Daily Supplement Tracker!
        </h1>
        <p className="text-gray-600 mb-6">
          Authentication system is working. Supplement tracking features coming next!
        </p>
        <p className="text-sm text-gray-500">
          User: {authData.user?.email || 'No user'}
        </p>
      </div>
    </div>
  )
}