import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContext'
import { 
  Supplement, 
  TimeCategory,
  SupplementLibraryItem,
  getUserTodaysData, 
  updateUserTodaysData,
  getUserSupplementLibrary,
  addSupplementFromLibrary,
  migrateDataToFirebase
} from '../utils/storage-enhanced'

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [supplementLibrary, setSupplementLibrary] = useState<SupplementLibraryItem[]>([])
  const [newSupplement, setNewSupplement] = useState({ 
    name: '', 
    dosage: '', 
    timeCategory: 'Morning (Wake + Breakfast)' as TimeCategory 
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [showLibrarySection, setShowLibrarySection] = useState(false)

  const timeCategories: TimeCategory[] = [
    'Morning (Wake + Breakfast)',
    'Midday (Lunch + Afternoon)',
    'Pre-Workout (Workout days)',
    'Evening (Dinner)',
    'Before Bed'
  ]

  // Load today's data on component mount
  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          // Attempt data migration from localStorage to Firebase if needed
          if (process.env.NEXT_PUBLIC_USE_FIREBASE === 'true') {
            const migrationResult = await migrateDataToFirebase(user.id)
            if (migrationResult.success) {
              console.log('Migration:', migrationResult.message)
            }
          }

          const [todaysData, library] = await Promise.all([
            getUserTodaysData(user.id),
            getUserSupplementLibrary(user.id)
          ])
          
          setSupplements(todaysData.supplements)
          setSupplementLibrary(library)
        } catch (error) {
          console.error('Error loading data:', error)
        }
      }
    }
    
    loadData()
  }, [user])

  const addSupplement = async () => {
    if (newSupplement.name.trim() && user) {
      const supplement: Supplement = {
        id: Date.now().toString(),
        name: newSupplement.name.trim(),
        dosage: newSupplement.dosage.trim() || '1 dose',
        takenAt: new Date(),
        timeCategory: newSupplement.timeCategory,
        completed: false
      }
      const updatedSupplements = [...supplements, supplement]
      setSupplements(updatedSupplements)
      
      try {
        await updateUserTodaysData(user.id, updatedSupplements)
      } catch (error) {
        console.error('Error saving supplement:', error)
      }
      
      setNewSupplement({ name: '', dosage: '', timeCategory: 'Morning (Wake + Breakfast)' })
      setShowAddForm(false)
    }
  }

  const toggleSupplement = async (id: string) => {
    if (user) {
      const updatedSupplements = supplements.map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
      )
      setSupplements(updatedSupplements)
      
      try {
        await updateUserTodaysData(user.id, updatedSupplements)
      } catch (error) {
        console.error('Error updating supplement:', error)
      }
    }
  }

  const removeSupplement = async (id: string) => {
    if (user) {
      const updatedSupplements = supplements.filter(s => s.id !== id)
      setSupplements(updatedSupplements)
      
      try {
        await updateUserTodaysData(user.id, updatedSupplements)
      } catch (error) {
        console.error('Error removing supplement:', error)
      }
    }
  }

  const addFromLibrary = async (libraryItem: SupplementLibraryItem, timeCategory: TimeCategory) => {
    if (user) {
      const supplement = addSupplementFromLibrary(libraryItem, timeCategory)
      const updatedSupplements = [...supplements, supplement]
      setSupplements(updatedSupplements)
      
      try {
        await updateUserTodaysData(user.id, updatedSupplements)
      } catch (error) {
        console.error('Error adding from library:', error)
      }
      
      setShowLibrarySection(false)
    }
  }

  if (isLoading) {
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

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Mobile-First Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 md:p-6 rounded-b-3xl shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Daily Supplements</h1>
          <p className="text-blue-100 text-sm md:text-base">Track your wellness journey</p>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Stats Overview - Mobile Optimized Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{supplements.length}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Total Supplements</div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{supplements.filter(s => s.completed).length}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Completed Today</div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">{supplements.filter(s => !s.completed).length}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Remaining Today</div>
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-md border border-gray-100">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                  {supplements.length > 0 ? Math.round((supplements.filter(s => s.completed).length / supplements.length) * 100) : 0}%
                </div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Complete Rate</div>
              </div>
            </div>
          </div>

          {/* Add Form - Mobile Optimized */}
          {showAddForm && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Supplement</h3>
              </div>
              <div className="p-4 md:p-6 space-y-4">
                {/* Quick Add from Library */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-700">Quick Add from Library</h4>
                    <button
                      onClick={() => setShowLibrarySection(!showLibrarySection)}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      {showLibrarySection ? 'Hide' : 'Show'} Library
                    </button>
                  </div>
                  
                  {showLibrarySection && (
                    <div className="space-y-3">
                      {supplementLibrary.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <p className="text-sm text-gray-600">{item.defaultDosage}</p>
                          </div>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addFromLibrary(item, e.target.value as TimeCategory)
                                e.target.value = ''
                              }
                            }}
                            className="ml-3 p-2 border border-gray-300 rounded-lg text-sm bg-white"
                            defaultValue=""
                          >
                            <option value="" disabled>Add to...</option>
                            {timeCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Manual Add Form */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Or Add Manually</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplement Name *
                      </label>
                      <input
                        type="text"
                        value={newSupplement.name}
                        onChange={(e) => setNewSupplement({...newSupplement, name: e.target.value})}
                        placeholder="e.g., Vitamin D3"
                        className="w-full p-4 md:p-3 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={newSupplement.dosage}
                        onChange={(e) => setNewSupplement({...newSupplement, dosage: e.target.value})}
                        placeholder="e.g., 1000 IU"
                        className="w-full p-4 md:p-3 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When to Take
                      </label>
                      <select
                        value={newSupplement.timeCategory}
                        onChange={(e) => setNewSupplement({...newSupplement, timeCategory: e.target.value as TimeCategory})}
                        className="w-full p-4 md:p-3 border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base md:text-sm"
                      >
                        {timeCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    onClick={addSupplement}
                    className="flex-1 bg-green-600 text-white py-4 md:py-2 px-6 rounded-xl md:rounded-lg hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-medium transform active:scale-95"
                  >
                    Add Supplement
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 md:py-2 px-6 rounded-xl md:rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-all duration-200 font-medium transform active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Supplements List - Mobile Optimized */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Today's Supplements</h2>
            </div>
            <div className="p-4 md:p-6">
              {supplements.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💊</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements today</h3>
                  <p className="text-gray-500 mb-6">Add your first supplement to get started</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium transform active:scale-95"
                  >
                    Add your first supplement
                  </button>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {timeCategories.map(timeCategory => {
                    const categorySupplements = supplements.filter(s => s.timeCategory === timeCategory)
                    if (categorySupplements.length === 0) return null
                    
                    return (
                      <div key={timeCategory} className="space-y-2 md:space-y-3">
                        <h3 className="text-base md:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                          {timeCategory}
                        </h3>
                        <div className="space-y-2">
                          {categorySupplements.map(supplement => (
                            <div 
                              key={supplement.id} 
                              className={`flex items-center justify-between p-4 md:p-5 rounded-xl border transition-all duration-200 ${
                                supplement.completed 
                                  ? 'bg-green-50 border-green-200 shadow-sm' 
                                  : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center space-x-3 md:space-x-4 flex-1">
                                <button
                                  onClick={() => toggleSupplement(supplement.id)}
                                  className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform active:scale-95 ${
                                    supplement.completed
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-gray-300 hover:border-green-400'
                                  }`}
                                >
                                  {supplement.completed && (
                                    <span className="text-white text-xs md:text-sm">✓</span>
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-base md:text-lg font-medium ${
                                    supplement.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    {supplement.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {supplement.dosage}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeSupplement(supplement.id)}
                                className="text-red-500 hover:text-red-700 p-2 transition-colors duration-200 transform active:scale-95"
                              >
                                <span className="text-lg md:text-xl">🗑️</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Add Button */}
        <div className="fixed bottom-20 right-4 md:hidden">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-14 h-14 rounded-full shadow-xl transition-all duration-200 transform active:scale-95 bg-blue-600 hover:bg-blue-700 ${
              showAddForm ? 'bg-blue-700' : ''
            }`}
          >
            <span className="text-white text-2xl">+</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}
