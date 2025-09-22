import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../contexts/AuthContext'
import { DayData, TimeCategory, getUserDailyData } from '../utils/storage'

export default function Weekly() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const [weeklyData, setWeeklyData] = useState<DayData[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())

  const timeCategories: TimeCategory[] = [
    'Morning (Wake + Breakfast)',
    'Midday (Lunch + Afternoon)',
    'Pre-Workout (Workout days)',
    'Evening (Dinner)',
    'Before Bed'
  ]

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
    if (!user) return
    
    const weekStart = getWeekStart(currentWeekStart)
    const weekDates = getWeekDates(weekStart)
    const userData = getUserDailyData(user.id)
    
    const weekData = weekDates.map(date => {
      const dateString = date.toISOString().split('T')[0]
      const dayData = userData.find(d => d.date === dateString)
      return dayData || {
        date: dateString,
        supplements: []
      }
    })
    
    setWeeklyData(weekData)
  }, [currentWeekStart, user])

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
    const date = new Date(dateString)
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
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500'
    if (percentage > 0) return 'bg-red-500'
    return 'bg-gray-300'
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
      <div className="p-4 pb-20 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Weekly View</h1>
          <p className="text-gray-600">Track your supplement consistency across the week</p>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              {!isCurrentWeek() && (
                <button
                  onClick={goToCurrentWeek}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                >
                  Go to current week
                </button>
              )}
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weeklyData.map((dayData, index) => {
            const dateInfo = formatDate(dayData.date)
            const completion = getDayCompletion(dayData)
            const isToday = dayData.date === new Date().toISOString().split('T')[0]
            
            return (
              <div
                key={dayData.date}
                className={`bg-white rounded-xl shadow-sm border p-4 ${
                  isToday ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                {/* Day Header */}
                <div className="text-center mb-3">
                  <div className="text-sm font-medium text-gray-500">
                    {dateInfo.dayName}
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {dateInfo.dayNumber}
                  </div>
                  <div className="text-xs text-gray-400">
                    {dateInfo.month}
                  </div>
                </div>

                {/* Completion Circle */}
                <div className="flex justify-center mb-3">
                  <div className="relative w-16 h-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - completion / 100)}`}
                        className={
                          completion === 100 ? 'text-green-500' :
                          completion >= 75 ? 'text-yellow-500' :
                          completion >= 50 ? 'text-orange-500' :
                          completion > 0 ? 'text-red-500' : 'text-gray-300'
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">
                        {completion}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supplement Count */}
                <div className="text-center">
                  <div className="text-sm text-gray-600">
                    {dayData.supplements.filter(s => s.completed).length} / {dayData.supplements.length}
                  </div>
                  <div className="text-xs text-gray-400">
                    supplements
                  </div>
                </div>

                {/* Category Indicators */}
                {dayData.supplements.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {timeCategories.map(category => {
                      const categorySupplements = dayData.supplements.filter(s => s.timeCategory === category)
                      if (categorySupplements.length === 0) return null
                      
                      const categoryCompletion = categorySupplements.filter(s => s.completed).length
                      const categoryTotal = categorySupplements.length
                      
                      return (
                        <div key={category} className="flex items-center justify-between text-xs">
                          <span className="flex items-center">
                            <span className="mr-1">{getCategoryIcon(category)}</span>
                            <span className="text-gray-600 truncate">
                              {category.split(' ')[0]}
                            </span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-white text-xs ${
                            categoryCompletion === categoryTotal ? 'bg-green-500' :
                            categoryCompletion > 0 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}>
                            {categoryCompletion}/{categoryTotal}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Weekly Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {weeklyData.reduce((total, day) => total + day.supplements.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Planned</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {weeklyData.reduce((total, day) => total + day.supplements.filter(s => s.completed).length, 0)}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(
                weeklyData.reduce((total, day) => {
                  if (day.supplements.length === 0) return total
                  return total + (day.supplements.filter(s => s.completed).length / day.supplements.length * 100)
                }, 0) / weeklyData.filter(day => day.supplements.length > 0).length || 0
              )}%
            </div>
            <div className="text-sm text-gray-600">Avg. Daily</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {weeklyData.filter(day => day.supplements.filter(s => s.completed).length === day.supplements.length && day.supplements.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">Perfect Days</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
