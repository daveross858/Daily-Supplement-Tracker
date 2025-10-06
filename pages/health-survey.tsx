import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../contexts/AuthContextFirebase'
import { useRouter } from 'next/router'
import { ChevronLeft, ChevronRight, Heart, Brain, Shield, Zap } from 'lucide-react'

interface SurveyData {
  // Demographics
  age: string
  gender: string
  weight: string
  height: string
  activityLevel: string
  
  // Medical History
  medicalConditions: string[]
  currentMedications: string[]
  allergies: string[]
  
  // Symptoms
  currentSymptoms: string[]
  energyLevel: string
  sleepQuality: string
  stressLevel: string
  digestiveIssues: string[]
  
  // Lifestyle
  diet: string
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  
  // Health Goals
  primaryGoals: string[]
  specificConcerns: string[]
  
  // Current Supplements
  currentSupplements: string[]
}

const initialSurveyData: SurveyData = {
  age: '',
  gender: '',
  weight: '',
  height: '',
  activityLevel: '',
  medicalConditions: [],
  currentMedications: [],
  allergies: [],
  currentSymptoms: [],
  energyLevel: '',
  sleepQuality: '',
  stressLevel: '',
  digestiveIssues: [],
  diet: '',
  smokingStatus: '',
  alcoholConsumption: '',
  exerciseFrequency: '',
  primaryGoals: [],
  specificConcerns: [],
  currentSupplements: []
}

const surveySteps = [
  {
    title: 'Basic Information',
    icon: Heart,
    description: 'Tell us about yourself'
  },
  {
    title: 'Medical History',
    icon: Shield,
    description: 'Your health background'
  },
  {
    title: 'Current Symptoms',
    icon: Brain,
    description: 'How are you feeling?'
  },
  {
    title: 'Lifestyle & Goals',
    icon: Zap,
    description: 'Your daily habits and objectives'
  }
]

export default function HealthSurvey() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [surveyData, setSurveyData] = useState<SurveyData>(initialSurveyData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleInputChange = (field: keyof SurveyData, value: string | string[]) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayToggle = (field: keyof SurveyData, value: string) => {
    setSurveyData(prev => {
      const currentArray = prev[field] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      return {
        ...prev,
        [field]: newArray
      }
    })
  }

  const nextStep = () => {
    if (currentStep < surveySteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Store survey data and redirect to results
      localStorage.setItem('healthSurveyData', JSON.stringify(surveyData))
      router.push('/survey-results')
    } catch (error) {
      console.error('Error submitting survey:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl text-white">💊</span>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <select
                  value={surveyData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select age range</option>
                  <option value="18-25">18-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-45">36-45</option>
                  <option value="46-55">46-55</option>
                  <option value="56-65">56-65</option>
                  <option value="65+">65+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  value={surveyData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
                <input
                  type="number"
                  value={surveyData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                <select
                  value={surveyData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select height</option>
                  <option value="under-5ft">Under 5'0"</option>
                  <option value="5ft-5ft3">5'0" - 5'3"</option>
                  <option value="5ft4-5ft7">5'4" - 5'7"</option>
                  <option value="5ft8-5ft11">5'8" - 5'11"</option>
                  <option value="6ft-6ft3">6'0" - 6'3"</option>
                  <option value="over-6ft3">Over 6'3"</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
              <select
                value={surveyData.activityLevel}
                onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select activity level</option>
                <option value="sedentary">Sedentary (little to no exercise)</option>
                <option value="light">Light (1-3 days/week)</option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="active">Active (6-7 days/week)</option>
                <option value="very-active">Very Active (2x/day or intense training)</option>
              </select>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Medical Conditions (select all that apply)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Diabetes', 'High Blood Pressure', 'Heart Disease', 'High Cholesterol',
                  'Thyroid Issues', 'Arthritis', 'Osteoporosis', 'Depression/Anxiety',
                  'ADHD', 'Autoimmune Condition', 'Cancer History', 'Digestive Issues',
                  'Kidney Disease', 'Liver Disease', 'None'
                ].map(condition => (
                  <label key={condition} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={surveyData.medicalConditions.includes(condition)}
                      onChange={() => handleArrayToggle('medicalConditions', condition)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Current Medications</label>
              <textarea
                value={surveyData.currentMedications.join(', ')}
                onChange={(e) => handleInputChange('currentMedications', e.target.value.split(', ').filter(m => m.trim()))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List current medications, separated by commas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Allergies</label>
              <textarea
                value={surveyData.allergies.join(', ')}
                onChange={(e) => handleInputChange('allergies', e.target.value.split(', ').filter(a => a.trim()))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List any allergies, separated by commas"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Current Symptoms (select all that apply)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Fatigue', 'Joint Pain', 'Muscle Pain', 'Headaches',
                  'Brain Fog', 'Memory Issues', 'Mood Swings', 'Anxiety',
                  'Depression', 'Insomnia', 'Digestive Problems', 'Bloating',
                  'Skin Issues', 'Hair Loss', 'Weight Gain', 'Weight Loss',
                  'Frequent Colds', 'Allergies', 'None'
                ].map(symptom => (
                  <label key={symptom} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={surveyData.currentSymptoms.includes(symptom)}
                      onChange={() => handleArrayToggle('currentSymptoms', symptom)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level</label>
                <select
                  value={surveyData.energyLevel}
                  onChange={(e) => handleInputChange('energyLevel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="very-low">Very Low</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very-high">Very High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                <select
                  value={surveyData.sleepQuality}
                  onChange={(e) => handleInputChange('sleepQuality', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select quality</option>
                  <option value="very-poor">Very Poor</option>
                  <option value="poor">Poor</option>
                  <option value="fair">Fair</option>
                  <option value="good">Good</option>
                  <option value="excellent">Excellent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level</label>
                <select
                  value={surveyData.stressLevel}
                  onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="very-low">Very Low</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="very-high">Very High</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
              <select
                value={surveyData.diet}
                onChange={(e) => handleInputChange('diet', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select diet type</option>
                <option value="standard">Standard American Diet</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Ketogenic</option>
                <option value="paleo">Paleo</option>
                <option value="low-carb">Low Carb</option>
                <option value="gluten-free">Gluten Free</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Health Goals (select all that apply)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Increase Energy', 'Improve Sleep', 'Reduce Stress', 'Boost Immunity',
                  'Support Heart Health', 'Improve Brain Function', 'Joint Health',
                  'Weight Management', 'Digestive Health', 'Skin Health',
                  'Hair & Nail Health', 'Muscle Recovery', 'Bone Health',
                  'Hormonal Balance', 'Anti-Aging', 'General Wellness'
                ].map(goal => (
                  <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={surveyData.primaryGoals.includes(goal)}
                      onChange={() => handleArrayToggle('primaryGoals', goal)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Current Supplements</label>
              <textarea
                value={surveyData.currentSupplements.join(', ')}
                onChange={(e) => handleInputChange('currentSupplements', e.target.value.split(', ').filter(s => s.trim()))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List current supplements, separated by commas"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {surveySteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / surveySteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Survey Content */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {surveySteps[currentStep].title}
          </h2>
          <p className="text-gray-600 mb-6">
            {surveySteps[currentStep].description}
          </p>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </button>

            {currentStep === surveySteps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Analyzing...' : 'Get My Plan'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}