import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContextFirebase'
import { useRouter } from 'next/router'
import { Calendar, Eye, Brain, ArrowRight, Clock } from 'lucide-react'
import { getUserSurveyResults, SurveyResult } from '../utils/storage-enhanced'

export default function SurveyHistory() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (!user) return

    const loadSurveyHistory = async () => {
      try {
        const results = await getUserSurveyResults(user.id)
        setSurveyResults(results)
      } catch (error) {
        console.error('Error loading survey history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSurveyHistory()
  }, [user, isAuthenticated, isLoading, router])

  const handleViewResult = (resultId: string) => {
    // Store the result ID in localStorage to load specific result
    localStorage.setItem('viewSurveyResultId', resultId)
    router.push('/survey-results')
  }

  const getHealthConcernsPreview = (analysisResult: any) => {
    if (!analysisResult?.healthConcerns) return 'No concerns identified'
    
    const concerns = analysisResult.healthConcerns
    if (concerns.length === 0) return 'No significant concerns'
    
    const concernNames = concerns.slice(0, 2).map((c: any) => c.name)
    const additionalCount = concerns.length - 2
    
    let preview = concernNames.join(', ')
    if (additionalCount > 0) {
      preview += ` +${additionalCount} more`
    }
    
    return preview
  }

  const getSupplementCount = (analysisResult: any) => {
    return analysisResult?.supplementPlan?.length || 0
  }

  if (isLoading || loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">Loading survey history...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Survey History</h1>
          <p className="text-gray-600">View your previous health analyses and recommendations</p>
        </div>

        {surveyResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Survey Results Yet</h2>
            <p className="text-gray-600 mb-6">
              Take your first health survey to get personalized supplement recommendations.
            </p>
            <button
              onClick={() => router.push('/health-survey')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Take Health Survey
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {surveyResults.map((result, index) => (
              <div key={result.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Brain className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Health Analysis #{surveyResults.length - index}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {result.createdAt.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {result.createdAt.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Health Areas</p>
                          <p className="text-sm text-gray-600">
                            {getHealthConcernsPreview(result.analysisResult)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Supplements Recommended</p>
                          <p className="text-sm text-gray-600">
                            {getSupplementCount(result.analysisResult)} supplements
                          </p>
                        </div>
                      </div>

                      {result.lastViewedAt.getTime() !== result.createdAt.getTime() && (
                        <div className="text-xs text-gray-500 mb-3">
                          Last viewed: {result.lastViewedAt.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleViewResult(result.id)}
                      className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => router.push('/health-survey')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Take New Survey
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  )
}