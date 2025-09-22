import React, { useState } from 'react'
import Layout from '../components/Layout'

export default function Settings() {
  const [settings, setSettings] = useState({
    reminderEnabled: true,
    reminderTime: '08:00'
  })

  return (
    <Layout>
      <div className="bg-purple-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-purple-100">Manage your app preferences and data</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>
          <div className="p-6 space-y-6">
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
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Data Management</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">Export Data</h3>
                <p className="text-sm text-gray-500">Download your supplement data as JSON</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Export
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">Clear All Data</h3>
                <p className="text-sm text-gray-500">Remove all supplement data and settings</p>
              </div>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}