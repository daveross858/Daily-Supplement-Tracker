import React from 'react'

export default function Home() {
  console.log('Home component rendering...')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Minimal Test - No Hooks
        </h1>
        <p className="text-gray-600 mb-6">
          Testing without any hooks to isolate the issue
        </p>
      </div>
    </div>
  )
}