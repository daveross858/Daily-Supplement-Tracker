import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContextFirebase'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementLibraryItem | null>(null)
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('Morning (Wake + Breakfast)')
  const [migrationStatus, setMigrationStatus] = useState<string>('')
  const [activeSection, setActiveSection] = useState<'today' | 'library'>('today')
  const [currentDate, setCurrentDate] = useState<string>(new Date().toDateString())
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null)

  const timeCategories: TimeCategory[] = [
    'Morning (Wake + Breakfast)',
    'Midday (Lunch + Afternoon)',
    'Pre-Workout (Workout days)',
    'Evening (Dinner)',
    'Before Bed'
  ]

  // Filter supplements based on search term
  const filteredSupplements = supplementLibrary.filter(supplement =>
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if all supplements are completed
  const allSupplementsCompleted = supplements.length > 0 && supplements.every(s => s.completed)

  // Check if a new day has started
  const checkForNewDay = () => {
    const today = new Date().toDateString()
    if (currentDate !== today) {
      setCurrentDate(today)
      // Reset all supplements for the new day
      const resetSupplements = supplements.map(s => ({ ...s, completed: false }))
      setSupplements(resetSupplements)
      if (user) {
        updateUserTodaysData(user.id, resetSupplements)
      }
    }
  }

  // Complete day function
  const completeDay = async () => {
    if (user) {
      setLastCompletedDate(currentDate)
      // You could add additional logic here like saving completion to history
      console.log(`Day completed on ${currentDate}`)
    }
  }

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

  // Check for new day every minute
  useEffect(() => {
    const interval = setInterval(checkForNewDay, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [currentDate, supplements, user])

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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Daily Supplements</h1>
              <p className="text-blue-100 text-sm md:text-base">Track your wellness journey</p>
            </div>
            <div className="text-right">
              <div className="text-sm md:text-base text-blue-100 mb-1">Today</div>
              <div className="text-lg md:text-xl font-semibold">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveSection('today')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === 'today'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Today's Supplements
              </button>
              <button
                onClick={() => setActiveSection('library')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  activeSection === 'library'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Library
              </button>
            </div>
          </div>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Add Supplement</h3>
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setSearchTerm('')
                        setSelectedSupplement(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Search and select from your supplement library</p>
                </div>
                
                <div className="p-6">
                  {supplementLibrary.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📚</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No supplements in library</h4>
                      <p className="text-gray-500 mb-4">Add supplements to your library in Settings first</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search supplements..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
                      </div>

                      {/* Supplement List */}
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredSupplements.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No supplements match your search</p>
                          </div>
                        ) : (
                          filteredSupplements.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => setSelectedSupplement(item)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                selectedSupplement?.id === item.id
                                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                              }`}
                            >
                              <h5 className="font-medium text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-600">{item.defaultDosage}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Time Category Selection */}
                      {selectedSupplement && (
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            When to take {selectedSupplement.name}?
                          </label>
                          <select
                            value={selectedTimeCategory}
                            onChange={(e) => setSelectedTimeCategory(e.target.value as TimeCategory)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            {timeCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowAddModal(false)
                            setSearchTerm('')
                            setSelectedSupplement(null)
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (selectedSupplement) {
                              addFromLibrary(selectedSupplement, selectedTimeCategory)
                              setShowAddModal(false)
                              setSearchTerm('')
                              setSelectedSupplement(null)
                            }
                          }}
                          disabled={!selectedSupplement}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                            selectedSupplement
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Add Supplement
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'today' && (
            <>
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

              {/* Supplements List - Mobile Optimized */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Today's Supplements</h2>
                </div>
                <div className="p-4 md:p-6">
                  {supplements.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                        <span className="text-2xl">�</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements today</h3>
                      <p className="text-gray-500 mb-6">Add supplements from your library to get started</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 font-medium transform active:scale-95"
                      >
                        Add from library
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

              {/* Complete Day Button */}
              {allSupplementsCompleted && lastCompletedDate !== currentDate && (
                <div className="mt-6 text-center">
                  <button
                    onClick={completeDay}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-semibold text-lg shadow-lg transform active:scale-95"
                  >
                    🎉 Complete Day! 🎉
                  </button>
                  <p className="text-sm text-gray-600 mt-2">All supplements taken for today!</p>
                </div>
              )}
            </>
          )}

          {activeSection === 'library' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Supplement Library</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your supplement collection</p>
              </div>
              <div className="p-4 md:p-6">
                {supplementLibrary.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-50 rounded-full flex items-center justify-center">
                      <span className="text-2xl">�</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your library is empty</h3>
                    <p className="text-gray-500 mb-6">Add supplements to your library to get started</p>
                    <p className="text-sm text-gray-400">Note: Library management is coming soon!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supplementLibrary.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200">
                        <div className="flex-1">
                          <h5 className="text-base md:text-lg font-medium text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">{item.defaultDosage}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSupplement(item)
                              setSelectedTimeCategory('Morning (Wake + Breakfast)')
                              setShowAddModal(true)
                            }}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Add to Today
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Add Button - Only show on Today tab */}
        {activeSection === 'today' && (
          <div className="fixed bottom-20 right-4 md:hidden">
            <button
              onClick={() => setShowAddModal(true)}
              className={`w-14 h-14 rounded-full shadow-xl transition-all duration-200 transform active:scale-95 bg-blue-600 hover:bg-blue-700 ${
                showAddModal ? 'bg-blue-700' : ''
              }`}
            >
              <span className="text-white text-2xl">+</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
