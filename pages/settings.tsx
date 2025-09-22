import React, { useState } from 'react'
import Layout from '../components/Layout'

interface SupplementLibraryItem {
  id: string
  name: string
  defaultDosage: string
  category: string
}

export default function Settings() {
  const [supplementLibrary, setSupplementLibrary] = useState<SupplementLibraryItem[]>([
    { id: '1', name: 'Vitamin D3', defaultDosage: '1000 IU', category: 'Vitamins' },
    { id: '2', name: 'Omega-3', defaultDosage: '1000mg', category: 'Essential Fatty Acids' },
    { id: '3', name: 'Multivitamin', defaultDosage: '1 tablet', category: 'Vitamins' },
    { id: '4', name: 'Magnesium', defaultDosage: '400mg', category: 'Minerals' },
    { id: '5', name: 'Vitamin C', defaultDosage: '500mg', category: 'Vitamins' },
    { id: '6', name: 'Zinc', defaultDosage: '15mg', category: 'Minerals' },
    { id: '7', name: 'Probiotics', defaultDosage: '1 capsule', category: 'Digestive Health' },
  ])

  const [newSupplement, setNewSupplement] = useState({
    name: '',
    defaultDosage: '',
    category: 'Vitamins'
  })

  const [settings, setSettings] = useState({
    dailyGoal: 5,
    reminderEnabled: true,
    reminderTime: '08:00'
  })

  const categories = ['Vitamins', 'Minerals', 'Essential Fatty Acids', 'Digestive Health', 'Herbal', 'Other']

  const addToLibrary = () => {
    if (newSupplement.name.trim()) {
      const supplement: SupplementLibraryItem = {
        id: Date.now().toString(),
        name: newSupplement.name.trim(),
        defaultDosage: newSupplement.defaultDosage.trim() || '1 dose',
        category: newSupplement.category
      }
      setSupplementLibrary([...supplementLibrary, supplement])
      setNewSupplement({ name: '', defaultDosage: '', category: 'Vitamins' })
    }
  }

  const removeFromLibrary = (id: string) => {
    setSupplementLibrary(supplementLibrary.filter(s => s.id !== id))
  }

  const groupedSupplements = supplementLibrary.reduce((groups, supplement) => {
    const category = supplement.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(supplement)
    return groups
  }, {} as Record<string, SupplementLibraryItem[]>)

  return (
    <Layout>
      <div className="bg-purple-600 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-purple-100">Manage your supplement library and preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">General Settings</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Supplement Goal
              </label>
              <select
                value={settings.dailyGoal}
                onChange={(e) => setSettings({...settings, dailyGoal: Number(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num} supplement{num !== 1 ? 's' : ''} per day</option>
                ))}
              </select>
            </div>

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

        {/* Add New Supplement */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Add to Supplement Library</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplement Name *
                </label>
                <input
                  type="text"
                  value={newSupplement.name}
                  onChange={(e) => setNewSupplement({...newSupplement, name: e.target.value})}
                  placeholder="e.g., Vitamin B12"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Dosage
                </label>
                <input
                  type="text"
                  value={newSupplement.defaultDosage}
                  onChange={(e) => setNewSupplement({...newSupplement, defaultDosage: e.target.value})}
                  placeholder="e.g., 1000 mcg"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newSupplement.category}
                  onChange={(e) => setNewSupplement({...newSupplement, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addToLibrary}
              className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add to Library
            </button>
          </div>
        </div>

        {/* Supplement Library */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Supplement Library</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage your supplement collection for quick adding
            </p>
          </div>
          <div className="p-6">
            {Object.keys(groupedSupplements).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No supplements in your library yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSupplements).map(([category, supplements]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {supplements.map((supplement) => (
                        <div key={supplement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{supplement.name}</h4>
                            <p className="text-sm text-gray-500">{supplement.defaultDosage}</p>
                          </div>
                          <button
                            onClick={() => removeFromLibrary(supplement.id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                <p className="text-sm text-gray-500">Remove all supplement history and settings</p>
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