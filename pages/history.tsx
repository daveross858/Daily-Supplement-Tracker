import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { DayData, TimeCategory, getDailyData } from '../utils/storage'

export default function History() {
  const [historyData, setHistoryData] = useState<DayData[]>([])

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

  // Load history data on component mount
  useEffect(() => {
    const data = getDailyData()
    // Sort by date descending (newest first)
    const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setHistoryData(sortedData)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getTotalSupplements = () => {
    return historyData.reduce((total, day) => total + day.supplements.length, 0)
  }

  const getTotalCompleted = () => {
    return historyData.reduce((total, day) => 
      total + day.supplements.filter(s => s.completed).length, 0)
  }

  const getAverageDailySupplement = () => {
    if (historyData.length === 0) return 0
    return Math.round(getTotalSupplements() / historyData.length)
  }

  const getCompletionRate = () => {
    const total = getTotalSupplements()
    if (total === 0) return 0
    return Math.round((getTotalCompleted() / total) * 100)
  }

  return (
    <Layout>
      {/* Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Supplement History</h1>
          <p className="text-green-100 text-sm md:text-base">Track your supplement consistency over time</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Stats Overview - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{getTotalSupplements()}</div>
              <div className="text-xs md:text-sm text-gray-500">Total Supplements</div>
              <div className="text-xs text-gray-400 mt-1">Last {historyData.length} days</div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{getTotalCompleted()}</div>
              <div className="text-xs md:text-sm text-gray-500">Completed</div>
              <div className="text-xs text-gray-400 mt-1">supplements taken</div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{getCompletionRate()}%</div>
              <div className="text-xs md:text-sm text-gray-500">Completion Rate</div>
              <div className="text-xs text-gray-400 mt-1">overall adherence</div>
            </div>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{getAverageDailySupplement()}</div>
              <div className="text-xs md:text-sm text-gray-500">Daily Average</div>
              <div className="text-xs text-gray-400 mt-1">supplements per day</div>
            </div>
          </div>
        </div>

        {/* History Timeline - Mobile Optimized */}
        <div className="space-y-4 md:space-y-6">
          {historyData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
              <p className="text-gray-500">Start tracking your supplements to see your history here.</p>
            </div>
          ) : (
            historyData.map((day) => (
              <div key={day.date} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatDate(day.date)}
                    </h3>
                    <div className="flex items-center gap-3">
                      {day.supplements.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {day.supplements.filter(s => s.completed).length}/{day.supplements.length} completed
                        </span>
                      )}
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {day.supplements.length} supplement{day.supplements.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  {day.supplements.length === 0 ? (
                    <p className="text-gray-500 italic text-center py-4">No supplements tracked this day</p>
                  ) : (
                    <div className="space-y-4 md:space-y-6">
                      {timeCategories.map((category) => {
                        const categorySupplements = day.supplements.filter(s => s.timeCategory === category)
                        if (categorySupplements.length === 0) return null
                        
                        return (
                          <div key={category} className="border border-gray-200 rounded-xl p-4 md:p-5 bg-gray-50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-xl md:text-2xl">{getCategoryIcon(category)}</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-base md:text-lg">
                                  {category.split(' (')[0]}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {categorySupplements.filter(s => s.completed).length}/{categorySupplements.length} completed
                                </p>
                              </div>
                              {categorySupplements.every(s => s.completed) && categorySupplements.length > 0 && (
                                <div className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                                  ✓ Done
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categorySupplements.map((supplement) => (
                                <div 
                                  key={supplement.id} 
                                  className={`p-4 rounded-xl transition-all ${
                                    supplement.completed 
                                      ? 'bg-green-50 border-2 border-green-200' 
                                      : 'bg-white border-2 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className={`flex-1 ${supplement.completed ? 'opacity-70' : ''}`}>
                                      <h5 className={`font-medium text-base md:text-sm ${
                                        supplement.completed ? 'line-through text-gray-600' : 'text-gray-900'
                                      }`}>
                                        {supplement.name}
                                      </h5>
                                      <div className="text-sm text-gray-500 space-y-1 mt-1">
                                        <p>{supplement.dosage}</p>
                                        <p>Added: {supplement.takenAt.toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}</p>
                                      </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-3 ${
                                      supplement.completed 
                                        ? 'bg-green-100' 
                                        : 'bg-gray-100'
                                    }`}>
                                      {supplement.completed ? (
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : (
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
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
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}