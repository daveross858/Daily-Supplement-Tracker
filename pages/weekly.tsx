import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContextFirebase'
import { DayData, TimeCategory, getUserDailyData, saveDailyTemplate, getDailyTemplate, applyDailyTemplate } from '../utils/storage-enhanced'

export default function Weekly() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [weeklyData, setWeeklyData] = useState<DayData[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const [hasTemplate, setHasTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [applyingToRange, setApplyingToRange] = useState(false)

  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  // Get the week dates (Sunday through Saturday)
  const getWeekDates = (weekStart: Date) => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Load weekly data
  useEffect(() => {
    async function loadWeeklyData() {
      if (!user) return
      
      const weekStart = getWeekStart(currentWeekStart)
      const weekDates = getWeekDates(weekStart)
      
      try {
        const [userData, template] = await Promise.all([
          getUserDailyData(user.id),
          getDailyTemplate(user.id)
        ])
        
        setHasTemplate(!!template)
        
        const weekData = weekDates.map(date => {
          const dateString = date.toISOString().split('T')[0]
          const dayData = userData.find(d => d.date === dateString)
          return dayData || {
            date: dateString,
            supplements: []
          }
        })
        
        setWeeklyData(weekData)
      } catch (error) {
        console.error('Error loading weekly data:', error)
      }
    }
    
    loadWeeklyData()
  }, [currentWeekStart, user])

  const timeCategories: TimeCategory[] = [
    'Morning (Wake + Breakfast)',
    'Midday (Lunch + Afternoon)',
    'Pre-Workout (Workout days)',
    'Evening (Dinner)',
    'Before Bed'
  ]

  // Get category icon
  const getCategoryIcon = (category: TimeCategory): string => {
    switch (category) {
      case 'Morning (Wake + Breakfast)': return '🌅'
      case 'Midday (Lunch + Afternoon)': return '☀️'
      case 'Pre-Workout (Workout days)': return '💪'
      case 'Evening (Dinner)': return '🌆'
      case 'Before Bed': return '🌙'
      default: return '💊'
    }
  }

  // Authentication loading state
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

  // Authentication check
  if (!isAuthenticated) {
    return <AuthForm />
  }

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date())
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    // Parse date manually to avoid timezone issues
    const parts = dateString.split('-')
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    return {
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  // Get completion percentage for a day
  const getDayCompletion = (dayData: DayData) => {
    if (!dayData.supplements.length) return 0
    const completed = dayData.supplements.filter(s => s.completed).length
    return Math.round((completed / dayData.supplements.length) * 100)
  }

  // Get completion color
  const getCompletionColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200'
    if (percentage < 50) return 'bg-red-400'
    if (percentage < 100) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  // Template handling functions
  const handleSaveTodayAsTemplate = async () => {
    if (!user) return
    
    // Get today's supplements
    const today = new Date().toISOString().split('T')[0]
    const todayData = weeklyData.find(day => day.date === today)
    
    if (!todayData || !todayData.supplements.length) {
      console.error('No supplements found for today')
      return
    }
    
    setSavingTemplate(true)
    try {
      const result = await saveDailyTemplate(user.id, todayData.supplements)
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

  const handleApplyTemplateToDay = async (targetDate: string) => {
    if (!user || !hasTemplate) return
    
    try {
      const result = await applyDailyTemplate(user.id, targetDate)
      if (result.success) {
        // Reload weekly data to show the applied template
        const userData = await getUserDailyData(user.id)
        const weekStart = getWeekStart(currentWeekStart)
        const weekDates = getWeekDates(weekStart)
        
        const weekData = weekDates.map(date => {
          const dateString = date.toISOString().split('T')[0]
          const dayData = userData.find(d => d.date === dateString)
          return dayData || {
            date: dateString,
            supplements: []
          }
        })
        
        setWeeklyData(weekData)
        console.log('Template applied successfully!')
      } else {
        console.error('Failed to apply template:', result.error)
      }
    } catch (error) {
      console.error('Error applying template:', error)
    }
  }

  const handleApplyTemplateToDateRange = async () => {
    if (!user || !hasTemplate || !dateRangeStart || !dateRangeEnd) return
    
    // Validate date range
    const startDate = new Date(dateRangeStart)
    const endDate = new Date(dateRangeEnd)
    
    if (endDate < startDate) {
      alert('End date must be after start date')
      return
    }
    
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > 90) {
      alert('Date range cannot exceed 90 days')
      return
    }
    
    setApplyingToRange(true)
    
    try {
      const dates = []
      const currentDate = new Date(startDate)
      
      // Generate all dates in the range
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      // Apply template to each date
      let successCount = 0
      let errorCount = 0
      
      console.log('Applying template to dates:', dates)
      
      for (const dateString of dates) {
        try {
          console.log(`Applying template to date: ${dateString}`)
          const result = await applyDailyTemplate(user.id, dateString)
          console.log(`Result for ${dateString}:`, result)
          if (result.success) {
            successCount++
          } else {
            errorCount++
            console.error(`Failed to apply template to ${dateString}:`, result.error)
          }
        } catch (error) {
          errorCount++
          console.error(`Error applying template to ${dateString}:`, error)
        }
      }
      
      // Reload weekly data to show changes in current view
      const userData = await getUserDailyData(user.id)
      const weekStart = getWeekStart(currentWeekStart)
      const weekDates = getWeekDates(weekStart)
      
      const weekData = weekDates.map(date => {
        const dateString = date.toISOString().split('T')[0]
        const dayData = userData.find(d => d.date === dateString)
        return dayData || {
          date: dateString,
          supplements: []
        }
      })
      
      setWeeklyData(weekData)
      
      // Show results with option to navigate to applied dates
      if (errorCount === 0) {
        const startDateObj = new Date(dateRangeStart)
        const endDateObj = new Date(dateRangeEnd)
        const currentWeekStartTime = getWeekStart(currentWeekStart).getTime()
        const currentWeekEndTime = new Date(currentWeekStartTime + 6 * 24 * 60 * 60 * 1000).getTime()
        
        // Check if any applied dates are outside current week
        const appliedDatesOutsideCurrentWeek = dates.some(dateStr => {
          const dateTime = new Date(dateStr).getTime()
          return dateTime < currentWeekStartTime || dateTime > currentWeekEndTime
        })
        
        if (appliedDatesOutsideCurrentWeek) {
          const shouldNavigate = confirm(`✅ Template applied successfully to ${successCount} days!\n\nSome dates are outside the current week view. Would you like to navigate to see the first applied date?`)
          if (shouldNavigate) {
            setCurrentWeekStart(startDateObj)
          }
        } else {
          alert(`✅ Template applied successfully to ${successCount} days!`)
        }
      } else {
        alert(`⚠️ Template applied to ${successCount} days, but ${errorCount} days had errors.`)
      }
      
      // Reset form
      setDateRangeStart('')
      setDateRangeEnd('')
      setShowDateRangePicker(false)
      
    } catch (error) {
      console.error('Error applying template to date range:', error)
      alert('Error applying template to date range')
    } finally {
      setApplyingToRange(false)
    }
  }

  const weekStart = getWeekStart(currentWeekStart)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const isCurrentWeek = () => {
    const today = new Date()
    const todayWeekStart = getWeekStart(today)
    return weekStart.getTime() === todayWeekStart.getTime()
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="p-4 md:p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs">Track your supplement consistency across the week</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Week Navigation */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 md:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Previous week"
            >
              <span className="text-base md:text-lg">←</span>
            </button>
            
            <div className="text-center flex-1 px-2">
              <h2 className="text-sm md:text-lg font-semibold text-gray-900 leading-tight">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h2>
              {!isCurrentWeek() && (
                <button
                  onClick={goToCurrentWeek}
                  className="text-xs md:text-sm text-blue-600 hover:text-blue-700 mt-1 touch-manipulation"
                >
                  Go to current week
                </button>
              )}
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 md:p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Next week"
            >
              <span className="text-base md:text-lg">→</span>
            </button>
          </div>
        </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 md:gap-4">
            {weeklyData.map((dayData, index) => {
              const dateInfo = formatDate(dayData.date)
              const completion = getDayCompletion(dayData)
              const isToday = dayData.date === new Date().toISOString().split('T')[0]
              
              return (
                <div
                  key={dayData.date}
                  className={`bg-white rounded-xl shadow-md border p-4 md:p-6 transition-all duration-200 ${
                    isToday ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'
                  } ${completion === 100 ? 'bg-green-50 border-green-200' : ''}`}
                >
                {/* Day Header */}
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">
                        {dateInfo.dayName}
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {dateInfo.dayNumber}
                      </span>
                      <span className="text-sm text-gray-400">
                        {dateInfo.month}
                      </span>
                    </div>
                    {completion === 100 && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-medium">Complete</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplements Summary */}
                <div className="space-y-3">
                  {/* Items Count */}
                  {dayData.supplements.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                        {dayData.supplements.length} supplements
                      </span>
                      <span className="text-sm text-gray-600">
                        {dayData.supplements.filter(s => s.completed).length} / {dayData.supplements.length} completed
                      </span>
                    </div>
                  )}

                  {/* Category Indicators - All sizes */}
                  {dayData.supplements.length > 0 && (
                    <div className="space-y-2">
                      {timeCategories
                        .filter(category => dayData.supplements.some(s => s.timeCategory === category))
                        .map(category => {
                          const categorySupplements = dayData.supplements.filter(s => s.timeCategory === category)
                          const categoryCompletion = categorySupplements.filter(s => s.completed).length
                          const categoryTotal = categorySupplements.length
                          
                          return (
                            <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="flex items-center text-sm">
                                <span className="mr-2">{getCategoryIcon(category)}</span>
                                <span className="text-gray-700">{category}</span>
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                categoryCompletion === categoryTotal ? 'bg-green-100 text-green-700' :
                                categoryCompletion > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {categoryCompletion}/{categoryTotal}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              {weeklyData.reduce((total, day) => total + day.supplements.length, 0)}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Total Planned</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {weeklyData.reduce((total, day) => total + day.supplements.filter(s => s.completed).length, 0)}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Completed</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">
              {Math.round(
                weeklyData.reduce((total, day) => {
                  if (day.supplements.length === 0) return total
                  return total + (day.supplements.filter(s => s.completed).length / day.supplements.length * 100)
                }, 0) / weeklyData.filter(day => day.supplements.length > 0).length || 0
              )}%
            </div>
            <div className="text-xs md:text-sm text-gray-600">Avg. Daily</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              {weeklyData.filter(day => day.supplements.filter(s => s.completed).length === day.supplements.length && day.supplements.length > 0).length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Perfect Days</div>
          </div>
        </div>

        {/* Template Management Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6">
          <div className="text-center">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">📅 Daily Template Management</h3>
            
            {/* Save Today as Template */}
            <div className="space-y-3 md:space-y-4">
              {(() => {
                const today = new Date().toISOString().split('T')[0]
                const todayData = weeklyData.find(day => day.date === today)
                const hasTodaySupplements = todayData && todayData.supplements.length > 0
                
                return (
                  <div>
                    <button
                      onClick={handleSaveTodayAsTemplate}
                      disabled={!hasTodaySupplements || savingTemplate}
                      className="w-full md:w-auto bg-purple-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-purple-700 active:bg-purple-800 transition-all duration-200 font-medium shadow-md transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
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
                          💾 Save Today as Template
                          {hasTemplate && <span className="ml-2 text-purple-200 hidden md:inline">(Update)</span>}
                        </>
                      )}
                    </button>
                    <p className="text-xs md:text-sm text-gray-600 mt-2">
                      {!hasTodaySupplements 
                        ? 'Add supplements to today first' 
                        : hasTemplate 
                          ? 'Update your daily template with today\'s supplements' 
                          : 'Save today\'s supplements as your daily template'
                      }
                    </p>
                  </div>
                )
              })()}
              
              {/* Template Status and Apply Options */}
              {hasTemplate && (
                <div className="pt-3 md:pt-4 border-t border-gray-200">
                  <p className="text-xs md:text-sm text-green-600 font-medium mb-2 md:mb-3">✅ You have a daily template saved!</p>
                  <div className="text-xs text-gray-500 mb-3 md:mb-4">
                    Your template will automatically apply to new days. You can also manually apply it to specific days or date ranges below.
                  </div>
                  
                  {/* Quick Apply Buttons for Empty Days */}
                  <div className="mb-3 md:mb-4">
                    <h4 className="text-xs md:text-sm font-medium text-gray-700 mb-2">Quick Apply to Empty Days:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {weeklyData
                        .filter(day => day.supplements.length === 0)
                        .slice(0, 4) // Show max 4 buttons
                        .map((emptyDay) => {
                          const dateInfo = formatDate(emptyDay.date)
                          return (
                            <button
                              key={emptyDay.date}
                              onClick={() => handleApplyTemplateToDay(emptyDay.date)}
                              className="bg-blue-50 text-blue-700 px-3 py-2.5 md:py-2 rounded-lg hover:bg-blue-100 transition-all duration-200 text-xs font-medium border border-blue-200 touch-manipulation"
                            >
                              Apply to {dateInfo.dayName} {dateInfo.dayNumber}
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  {/* Date Range Application */}
                  <div className="pt-3 md:pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs md:text-sm font-medium text-gray-700">Apply to Date Range:</h4>
                      <button
                        onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                        className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium touch-manipulation"
                      >
                        {showDateRangePicker ? '✕ Cancel' : '📅 Select Range'}
                      </button>
                    </div>
                    
                    {showDateRangePicker && (
                      <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3 md:space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={dateRangeStart}
                              onChange={(e) => setDateRangeStart(e.target.value)}
                              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={dateRangeEnd}
                              onChange={(e) => setDateRangeEnd(e.target.value)}
                              className="w-full px-3 py-2.5 md:py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                              min={dateRangeStart || new Date().toISOString().split('T')[0]}
                            />
                          </div>
                        </div>
                        
        {dateRangeStart && dateRangeEnd && (
          <div className="text-xs text-gray-600">
            {(() => {
              const start = new Date(dateRangeStart)
              const end = new Date(dateRangeEnd)
              const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
              return (
                <div>
                  <div>Will apply template to {days} day{days !== 1 ? 's' : ''}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    From {start.toLocaleDateString()} to {end.toLocaleDateString()}
                  </div>
                </div>
              )
            })()}
          </div>
        )}                                                
                        <div className="flex flex-col md:flex-row gap-2">
                          <button
                            onClick={handleApplyTemplateToDateRange}
                            disabled={!dateRangeStart || !dateRangeEnd || applyingToRange}
                            className="flex-1 bg-green-600 text-white px-4 py-2.5 md:py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 touch-manipulation"
                          >
                            {applyingToRange ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Applying...
                              </span>
                            ) : (
                              '📅 Apply to Range'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setDateRangeStart('')
                              setDateRangeEnd('')
                              setShowDateRangePicker(false)
                            }}
                            className="md:flex-none px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all duration-200 touch-manipulation"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </Layout>
  )
}
