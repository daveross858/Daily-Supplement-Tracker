import React from 'react'
import { useAuth } from '../contexts/AuthContextFirebase'

export default function Home() {
  console.log('About to call useAuth...')
  const auth = useAuth()
  console.log('useAuth called successfully:', { isLoading: auth.isLoading, isAuthenticated: auth.isAuthenticated })
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Testing useAuth Hook Only
        </h1>
        <p className="text-gray-600 mb-6">
          Auth status: {auth.isLoading ? 'Loading...' : auth.isAuthenticated ? 'Authenticated' : 'Not authenticated'}
        </p>
        <p className="text-sm text-gray-500">
          User: {auth.user?.email || 'No user'}
        </p>
      </div>
    </div>
  )
}