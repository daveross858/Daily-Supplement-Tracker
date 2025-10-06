import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContextFirebase'
import { useRouter } from 'next/router'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Heart, 
  Shield, 
  Zap, 
  Brain,
  Plus,
  ArrowRight,
  Calendar,
  Info
} from 'lucide-react'
import { 
  healthAnalysisService, 
  AnalysisResult, 
  HealthConcern, 
  SupplementRecommendation 
} from '../utils/health-analysis'
import { 
  getUserSupplementLibrary, 
  saveUserSupplementLibrary, 
  SupplementLibraryItem,
  saveSurveyResult,
  getLatestSurveyResult,
  getSurveyResult,
  SurveyResult
} from '../utils/storage-enhanced'

export default function SurveyResults() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [addedSupplements, setAddedSupplements] = useState<Set<string>>(new Set())
  const [savedResult, setSavedResult] = useState<SurveyResult | null>(null)
  const [isNewAnalysis, setIsNewAnalysis] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
      return
    }

    if (!user) return

    const initializeResults = async () => {
      // Check if we're loading a specific result by ID
      const viewResultId = localStorage.getItem('viewSurveyResultId')
      if (viewResultId) {
        localStorage.removeItem('viewSurveyResultId')
        const specificResult = await getSurveyResult(user.id, viewResultId)
        if (specificResult) {
          setSavedResult(specificResult)
          setAnalysisResult(specificResult.analysisResult)
          setIsAnalyzing(false)
          return
        }
      }
      
      // First check if there's a latest saved result
      const latestResult = await getLatestSurveyResult(user.id)
      
      // Check if there's new survey data from localStorage
      const surveyDataStr = localStorage.getItem('healthSurveyData')
      
      if (surveyDataStr && (!latestResult || confirm('You have existing survey results. Would you like to create a new analysis?'))) {
        // New survey data - analyze it
        try {
          const surveyData = JSON.parse(surveyDataStr)
          setIsNewAnalysis(true)
          
          // Simulate AI processing delay
          setTimeout(async () => {
            const result = healthAnalysisService.analyzeSurveyData(surveyData)
            setAnalysisResult(result)
            
            // Save the new result
            const resultId = await saveSurveyResult(user.id, surveyData, result)
            console.log('Survey result saved with ID:', resultId)
            
            // Clear the temporary survey data
            localStorage.removeItem('healthSurveyData')
            
            setIsAnalyzing(false)
          }, 3000)
        } catch (error) {
          console.error('Error analyzing survey data:', error)
          router.push('/health-survey')
        }
      } else if (latestResult) {
        // Load existing result
        setSavedResult(latestResult)
        setAnalysisResult(latestResult.analysisResult)
        setIsAnalyzing(false)
      } else {
        // No data at all - redirect to survey
        router.push('/health-survey')
      }
    }

    initializeResults()
  }, [isAuthenticated, isLoading, router, user])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleAddSupplement = async (supplement: SupplementRecommendation) => {
    if (!user) return

    try {
      const currentLibrary = await getUserSupplementLibrary(user.id)
      
      // Check if supplement already exists
      const existingSupplement = currentLibrary.find(item => 
        item.name.toLowerCase() === supplement.name.toLowerCase()
      )
      
      if (existingSupplement) {
        alert(`${supplement.name} is already in your supplement library!`)
        return
      }
      
      const newSupplement: SupplementLibraryItem = {
        id: Date.now().toString(),
        name: supplement.name,
        defaultDosage: supplement.dosage,
        category: 'AI Health Plan'
      }
      
      const updatedLibrary = [...currentLibrary, newSupplement]
      await saveUserSupplementLibrary(user.id, updatedLibrary)

      setAddedSupplements(prev => new Set([...Array.from(prev), supplement.name]))
      
      // Show success message
      alert(`${supplement.name} has been added to your supplement library!`)
    } catch (error) {
      console.error('Error adding supplement:', error)
      alert('Error adding supplement. Please try again.')
    }
  }

  const handleAddAllSupplements = async () => {
    if (!analysisResult || !user) return

    for (const supplement of analysisResult.supplementPlan) {
      if (!addedSupplements.has(supplement.name)) {
        await handleAddSupplement(supplement)
      }
    }
  }

  if (isLoading || isAnalyzing) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isAnalyzing ? 'Analyzing Your Health Profile...' : 'Loading...'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isAnalyzing 
                ? 'Our AI is reviewing your responses and creating a personalized supplement plan.' 
                : 'Please wait while we load your results.'
              }
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!analysisResult) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Analysis Error</h2>
            <p className="text-gray-600 mb-8">
              We encountered an error analyzing your survey. Please try again.
            </p>
            <button
              onClick={() => router.push('/health-survey')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Retake Survey
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isNewAnalysis ? 'Your New Health Analysis' : 'Your Health Analysis'}
          </h1>
          <p className="text-gray-600">Based on your responses, here are our AI-powered recommendations</p>
          {savedResult && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Analysis created: {savedResult.createdAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              {savedResult.lastViewedAt.getTime() !== savedResult.createdAt.getTime() && (
                <p>Last viewed: {savedResult.lastViewedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric', 
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              )}
            </div>
          )}
        </div>

        {/* Warning Flags */}
        {analysisResult.warningFlags.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Important Medical Notice</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {analysisResult.warningFlags.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Health Concerns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Heart className="w-6 h-6 text-red-500 mr-3" />
                Identified Health Areas
              </h2>
              
              {analysisResult.healthConcerns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-gray-600">Great news! No significant health concerns identified.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analysisResult.healthConcerns.map((concern, index) => (
                    <div 
                      key={concern.id} 
                      className={`border rounded-lg p-4 ${getSeverityColor(concern.severity)}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{concern.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          concern.severity === 'high' ? 'bg-red-200 text-red-800' :
                          concern.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-green-200 text-green-800'
                        }`}>
                          {concern.severity} priority
                        </span>
                      </div>
                      <p className="text-sm mb-3">{concern.description}</p>
                      {concern.relatedSymptoms.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-1">Related symptoms:</p>
                          <div className="flex flex-wrap gap-1">
                            {concern.relatedSymptoms.map((symptom, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white bg-opacity-50 rounded-full text-xs">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium mb-1">Lifestyle recommendations:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {concern.lifestyle_recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Recommendations */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="w-6 h-6 text-yellow-500 mr-3" />
                General Health Recommendations
              </h2>
              <ul className="space-y-3">
                {analysisResult.generalRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Supplement Plan */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Shield className="w-6 h-6 text-blue-500 mr-3" />
                  Supplement Plan
                </h2>
                {analysisResult.supplementPlan.length > 0 && (
                  <button
                    onClick={handleAddAllSupplements}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add All
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {analysisResult.supplementPlan.map((supplement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">{supplement.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(supplement.priority)}`}>
                        {supplement.priority}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{supplement.dosage} - {supplement.timing.join(', ')}</span>
                      </div>
                      <p className="text-gray-700">{supplement.reason}</p>
                    </div>

                    {supplement.interactions && supplement.interactions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-yellow-700 mb-1">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          May interact with: {supplement.interactions.join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleAddSupplement(supplement)}
                        disabled={addedSupplements.has(supplement.name)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                          addedSupplements.has(supplement.name)
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {addedSupplements.has(supplement.name) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Library
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Suggestions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-purple-500 mr-3" />
                Next Steps
              </h2>
              <ul className="space-y-3">
                {analysisResult.followUpSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <ArrowRight className="w-4 h-4 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 text-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/library')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            View Library
          </button>
          <button
            onClick={() => router.push('/survey-history')}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            View History
          </button>
          <button
            onClick={() => router.push('/health-survey')}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Retake Survey
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Medical Disclaimer</p>
              <p>
                This analysis is for informational purposes only and should not replace professional medical advice. 
                Always consult with a healthcare provider before starting any new supplement regimen, especially if you 
                have medical conditions or take medications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}