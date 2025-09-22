import React, { useState } from 'react'
import Layout from '../components/Layout'

export default function Settings() {
  const [settings, setSettings] = useState({
    reminderEnabled: true,
    reminderTime: '08:00'
  })

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="p-4 md:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs">Manage your app preferences and data</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">General Settings</h2>
            </div>
            <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminder"
                checked={settings.reminderEnabled}
                onChange={(e) => setSettings({...settings, reminderEnabled: e.target.checked})}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="reminder" className="ml-2 text-sm text-gray-700">
                Enable daily reminders
              </label>
            </div>

            {settings.reminderEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}
          </div>
        </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Data Management</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500">Download your supplement data as JSON</p>
                </div>
                <button className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium transform active:scale-95">
                  Export
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Clear All Data</h3>
                  <p className="text-sm text-gray-500">Remove all supplement data and settings</p>
                </div>
                <button className="bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl hover:bg-red-700 active:bg-red-800 transition-all duration-200 font-medium transform active:scale-95">
                  Clear Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}