import React, { useState, useEffect, useCallback } from 'react'
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
  migrateDataToFirebase,
  saveDailyTemplate,
  getDailyTemplate,
  applyDailyTemplate
} from '../utils/storage-enhanced'

export default function Home() {
  // CRITICAL: ALL hooks must be called in EXACTLY the same order every time
  const { isAuthenticated, isLoading, user } = useAuth()
  
  // State hooks - always called, never conditional
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [supplementLibrary, setSupplementLibrary] = useState<SupplementLibraryItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementLibraryItem | null>(null)
  const [selectedTimeCategory, setSelectedTimeCategory] = useState<TimeCategory>('Morning (Wake + Breakfast)')
  const [currentDate, setCurrentDate] = useState<string>(new Date().toDateString())
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [hasTemplate, setHasTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Mount effect - runs once
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Data loading effect - with proper dependencies
  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return

    let cancelled = false

    const loadData = async () => {
      try {
        console.log('Loading data for user:', user.id)
        
        if (process.env.NEXT_PUBLIC_USE_FIREBASE === 'true') {
          const migrationResult = await migrateDataToFirebase(user.id)
          if (migrationResult.success && !cancelled) {
            console.log('Migration successful')
          }
        }

        const [todaysData, library] = await Promise.all([
          getUserTodaysData(user.id),
          getUserSupplementLibrary(user.id)
        ])
        
        // Check if user has a daily template
        const template = await getDailyTemplate(user.id)
        
        if (!cancelled) {
          setSupplements(todaysData.supplements)
          setSupplementLibrary(library)
          setHasTemplate(!!template)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading data:', error)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [mounted, isAuthenticated, user?.id]) // Only user.id to prevent re-runs

  // Date checking effect - fixed to avoid circular dependency
  useEffect(() => {
    if (!mounted || !isAuthenticated || !user) return

    const checkDate = async () => {
      const today = new Date().toDateString()
      // Use a callback to get current state value to avoid stale closures
      setCurrentDate(prevDate => {
        if (prevDate !== today) {
          console.log('New day detected, changing from', prevDate, 'to', today)
          
          // Auto-apply daily template for new day if it exists
          const applyTemplate = async () => {
            try {
              const template = await getDailyTemplate(user.id)
              if (template && template.supplements.length > 0) {
                console.log('Applying daily template for new day')
                const result = await applyDailyTemplate(user.id)
                if (result.success) {
                  // Reload today's data to get the applied template
                  const todaysData = await getUserTodaysData(user.id)
                  setSupplements(todaysData.supplements)
                } else {
                  console.error('Failed to apply daily template:', result.error)
                  // Reset supplements if template application failed
                  setSupplements(prev => prev.map(s => ({ ...s, completed: false })))
                }
              } else {
                // No template, just reset existing supplements
                setSupplements(prev => prev.map(s => ({ ...s, completed: false })))
              }
            } catch (error) {
              console.error('Error applying daily template:', error)
              setSupplements(prev => prev.map(s => ({ ...s, completed: false })))
            }
          }
          
          applyTemplate()
          return today
        }
        return prevDate
      })
    }

    // Check immediately
    checkDate()
    
    // Then check every minute
    const interval = setInterval(checkDate, 60000)
    return () => clearInterval(interval)
  }, [mounted, isAuthenticated, user?.id]) // No currentDate dependency to avoid circular updates

  // Memoized handlers to prevent recreations
  const handleToggleSupplement = useCallback(async (id: string) => {
    if (!user) return
    
    setSupplements(prev => {
      const updated = prev.map(s => 
        s.id === id ? { ...s, completed: !s.completed } : s
      )
      updateUserTodaysData(user.id, updated).catch(console.error)
      return updated
    })
  }, [user?.id])

  const handleRemoveSupplement = useCallback(async (id: string) => {
    if (!user) return
    
    setSupplements(prev => {
      const updated = prev.filter(s => s.id !== id)
      updateUserTodaysData(user.id, updated).catch(console.error)
      return updated
    })
  }, [user?.id])

  const handleAddFromLibrary = useCallback(async (libraryItem: SupplementLibraryItem, timeCategory: TimeCategory) => {
    if (!user) return
    
    const supplement = addSupplementFromLibrary(libraryItem, timeCategory)
    setSupplements(prev => {
      const updated = [...prev, supplement]
      updateUserTodaysData(user.id, updated).catch(console.error)
      return updated
    })
  }, [user?.id])

  // Computed values
  const timeCategories: TimeCategory[] = [
    'Morning (Wake + Breakfast)',
    'Midday (Lunch + Afternoon)',
    'Pre-Workout (Workout days)',
    'Evening (Dinner)',
    'Before Bed'
  ]

  const filteredSupplements = supplementLibrary.filter(supplement =>
    supplement.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const allSupplementsCompleted = supplements.length > 0 && supplements.every(s => s.completed)

  // Event handlers
  const handleCompleteDay = () => {
    if (user) {
      setLastCompletedDate(currentDate)
      console.log(`Day completed on ${currentDate}`)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setSearchTerm('')
    setSelectedSupplement(null)
  }

  const handleAddSupplement = () => {
    if (selectedSupplement) {
      handleAddFromLibrary(selectedSupplement, selectedTimeCategory)
      handleCloseModal()
    }
  }

  const handleSaveDailyTemplate = async () => {
    if (!user || supplements.length === 0) return
    
    setSavingTemplate(true)
    try {
      const result = await saveDailyTemplate(user.id, supplements)
      if (result.success) {
        setHasTemplate(true)
        console.log('Daily template saved successfully!')
        // You could add a toast notification here
      } else {
        console.error('Failed to save daily template:', result.error)
        // You could add an error toast here
      }
    } catch (error) {
      console.error('Error saving daily template:', error)
    } finally {
      setSavingTemplate(false)
    }
  }

  // Early returns AFTER all hooks
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

  // Main render
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Header */}
        <div className="p-4 md:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto"> 
            <p className="text-xs">Track your wellness journey</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Add Supplement</h3>
                    <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                      <p className="text-gray-500 mb-4">Add supplements to your library first</p>
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
                          <>
                            {filteredSupplements.map((item) => (
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
                            ))}
                            
                            {/* Add to Library Button */}
                            <div className="pt-2 mt-4 border-t border-gray-200">
                              <button
                                onClick={() => window.location.href = '/library'}
                                className="w-full py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-lg hover:border-purple-400 hover:text-purple-700 transition-all duration-200 font-medium"
                              >
                                + Add New Supplement to Library
                              </button>
                            </div>
                          </>
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
                          onClick={handleCloseModal}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddSupplement}
                          disabled={!selectedSupplement}
                          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
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

          {/* Stats Overview */}
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

          {/* Supplements List */}
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
                              className={`p-3 md:p-4 rounded-xl border transition-all duration-200 ${
                                supplement.completed 
                                  ? 'bg-green-50 border-green-200 shadow-sm' 
                                  : 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <button
                                      onClick={() => handleToggleSupplement(supplement.id)}
                                      className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                        supplement.completed
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : 'border-gray-300 hover:border-blue-400'
                                      }`}
                                    >
                                      {supplement.completed && (
                                        <span className="text-xs md:text-sm">✓</span>
                                      )}
                                    </button>
                                    <div>
                                      <h4 className={`text-sm md:text-base font-medium ${
                                        supplement.completed ? 'text-green-800 line-through' : 'text-gray-900'
                                      }`}>
                                        {supplement.name}
                                      </h4>
                                      <p className={`text-xs md:text-sm ${
                                        supplement.completed ? 'text-green-600' : 'text-gray-600'
                                      }`}>
                                        {supplement.dosage}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveSupplement(supplement.id)}
                                  className="ml-2 text-red-400 hover:text-red-600 transition-colors p-1"
                                  title="Remove supplement"
                                >
                                  <span className="text-lg">×</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Add More Button */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:border-blue-400 hover:text-blue-700 transition-all duration-200 font-medium"
                    >
                      + Add more supplements
                    </button>
                  </div>
                </div>
              )}

              {/* Save for Everyday Button */}
              {supplements.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={handleSaveDailyTemplate}
                    disabled={savingTemplate}
                    className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 font-medium shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingTemplate ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <>
                        📅 Save for everyday
                        {hasTemplate && <span className="ml-2 text-purple-200">(Update)</span>}
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    {hasTemplate 
                      ? 'Update your daily supplement template' 
                      : 'Save this list as your daily template for future days'
                    }
                  </p>
                </div>
              )}

              {/* Complete Day Button */}
              {allSupplementsCompleted && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <button
                    onClick={handleCompleteDay}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-semibold text-lg shadow-lg transform active:scale-95"
                  >
                    🎉 Complete Day! 🎉
                  </button>
                  <p className="text-sm text-gray-600 mt-2">All supplements taken for today!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Add Button */}
        <div className="fixed bottom-20 right-4 md:hidden">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 rounded-full shadow-xl transition-all duration-200 transform active:scale-95 bg-blue-600 hover:bg-blue-700"
          >
            <span className="text-white text-2xl">+</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}