// AI Health Analysis Service
// This service analyzes survey responses to identify potential health issues
// and generate personalized supplement recommendations

export interface HealthConcern {
  id: string
  name: string
  severity: 'low' | 'moderate' | 'high'
  description: string
  relatedSymptoms: string[]
  recommendedSupplements: string[]
  lifestyle_recommendations: string[]
  medical_note?: string
}

export interface SupplementRecommendation {
  name: string
  dosage: string
  timing: string[]
  reason: string
  priority: 'high' | 'medium' | 'low'
  interactions?: string[]
  contraindications?: string[]
}

export interface AnalysisResult {
  healthConcerns: HealthConcern[]
  supplementPlan: SupplementRecommendation[]
  generalRecommendations: string[]
  warningFlags: string[]
  followUpSuggestions: string[]
}

interface SurveyData {
  age: string
  gender: string
  weight: string
  height: string
  activityLevel: string
  medicalConditions: string[]
  currentMedications: string[]
  allergies: string[]
  currentSymptoms: string[]
  energyLevel: string
  sleepQuality: string
  stressLevel: string
  digestiveIssues: string[]
  diet: string
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
  primaryGoals: string[]
  specificConcerns: string[]
  currentSupplements: string[]
}

class HealthAnalysisService {
  private supplementDatabase = {
    // Energy & Fatigue
    'Vitamin B12': {
      dosage: '1000mcg',
      timing: ['morning'],
      indications: ['fatigue', 'brain fog', 'low energy', 'memory issues'],
      interactions: ['metformin'],
      contraindications: []
    },
    'Iron': {
      dosage: '18mg',
      timing: ['morning'],
      indications: ['fatigue', 'weakness', 'cold hands/feet'],
      interactions: ['calcium', 'tea', 'coffee'],
      contraindications: ['hemochromatosis']
    },
    'CoQ10': {
      dosage: '100mg',
      timing: ['morning'],
      indications: ['fatigue', 'heart health', 'muscle pain'],
      interactions: ['warfarin'],
      contraindications: []
    },
    
    // Sleep & Stress
    'Magnesium': {
      dosage: '400mg',
      timing: ['evening'],
      indications: ['insomnia', 'anxiety', 'muscle cramps', 'high stress'],
      interactions: [],
      contraindications: ['kidney disease']
    },
    'Melatonin': {
      dosage: '3mg',
      timing: ['evening'],
      indications: ['insomnia', 'poor sleep quality'],
      interactions: ['blood thinners'],
      contraindications: ['autoimmune conditions']
    },
    'Ashwagandha': {
      dosage: '300mg',
      timing: ['evening'],
      indications: ['stress', 'anxiety', 'fatigue'],
      interactions: ['immunosuppressants'],
      contraindications: ['autoimmune conditions']
    },
    
    // Immune System
    'Vitamin D3': {
      dosage: '2000 IU',
      timing: ['morning'],
      indications: ['frequent colds', 'low immunity', 'bone health'],
      interactions: [],
      contraindications: ['hypercalcemia']
    },
    'Vitamin C': {
      dosage: '1000mg',
      timing: ['morning'],
      indications: ['frequent colds', 'low immunity', 'skin issues'],
      interactions: [],
      contraindications: ['kidney stones']
    },
    'Zinc': {
      dosage: '15mg',
      timing: ['evening'],
      indications: ['frequent colds', 'wound healing', 'hair loss'],
      interactions: ['copper'],
      contraindications: []
    },
    
    // Digestive Health
    'Probiotics': {
      dosage: '10 billion CFU',
      timing: ['morning'],
      indications: ['digestive issues', 'bloating', 'irregular bowel movements'],
      interactions: ['antibiotics'],
      contraindications: ['immunocompromised']
    },
    'Digestive Enzymes': {
      dosage: '1 capsule',
      timing: ['with meals'],
      indications: ['bloating', 'gas', 'indigestion'],
      interactions: [],
      contraindications: []
    },
    
    // Heart Health
    'Omega-3': {
      dosage: '1000mg',
      timing: ['morning'],
      indications: ['heart health', 'high cholesterol', 'inflammation'],
      interactions: ['blood thinners'],
      contraindications: ['fish allergy']
    },
    
    // Brain Health
    'Omega-3 DHA': {
      dosage: '500mg',
      timing: ['morning'],
      indications: ['brain fog', 'memory issues', 'depression'],
      interactions: ['blood thinners'],
      contraindications: ['fish allergy']
    },
    
    // Joint Health
    'Glucosamine': {
      dosage: '1500mg',
      timing: ['morning'],
      indications: ['joint pain', 'arthritis'],
      interactions: ['warfarin'],
      contraindications: ['shellfish allergy']
    },
    'Turmeric': {
      dosage: '500mg',
      timing: ['morning'],
      indications: ['joint pain', 'inflammation'],
      interactions: ['blood thinners'],
      contraindications: ['gallstones']
    }
  }

  analyzeSurveyData(surveyData: SurveyData): AnalysisResult {
    const healthConcerns = this.identifyHealthConcerns(surveyData)
    const supplementPlan = this.generateSupplementPlan(surveyData, healthConcerns)
    const generalRecommendations = this.generateGeneralRecommendations(surveyData)
    const warningFlags = this.identifyWarningFlags(surveyData)
    const followUpSuggestions = this.generateFollowUpSuggestions(surveyData, healthConcerns)

    return {
      healthConcerns,
      supplementPlan,
      generalRecommendations,
      warningFlags,
      followUpSuggestions
    }
  }

  private identifyHealthConcerns(surveyData: SurveyData): HealthConcern[] {
    const concerns: HealthConcern[] = []

    // Energy-related concerns
    if (surveyData.energyLevel === 'very-low' || surveyData.energyLevel === 'low' || 
        surveyData.currentSymptoms.includes('Fatigue')) {
      concerns.push({
        id: 'low-energy',
        name: 'Low Energy & Fatigue',
        severity: surveyData.energyLevel === 'very-low' ? 'high' : 'moderate',
        description: 'You may be experiencing chronic fatigue, which could be related to nutrient deficiencies, poor sleep, or underlying health conditions.',
        relatedSymptoms: ['Fatigue', 'Brain Fog', 'Memory Issues'],
        recommendedSupplements: ['Vitamin B12', 'Iron', 'CoQ10'],
        lifestyle_recommendations: ['Regular sleep schedule', 'Balanced nutrition', 'Regular exercise']
      })
    }

    // Sleep-related concerns
    if (surveyData.sleepQuality === 'poor' || surveyData.sleepQuality === 'very-poor' ||
        surveyData.currentSymptoms.includes('Insomnia')) {
      concerns.push({
        id: 'sleep-issues',
        name: 'Sleep Quality Issues',
        severity: surveyData.sleepQuality === 'very-poor' ? 'high' : 'moderate',
        description: 'Poor sleep quality can affect your immune system, energy levels, and overall health.',
        relatedSymptoms: ['Insomnia', 'Fatigue', 'Brain Fog'],
        recommendedSupplements: ['Magnesium', 'Melatonin'],
        lifestyle_recommendations: ['Sleep hygiene practices', 'Limit screen time before bed', 'Create bedtime routine']
      })
    }

    // Stress-related concerns
    if (surveyData.stressLevel === 'high' || surveyData.stressLevel === 'very-high' ||
        surveyData.currentSymptoms.includes('Anxiety')) {
      concerns.push({
        id: 'high-stress',
        name: 'High Stress Levels',
        severity: surveyData.stressLevel === 'very-high' ? 'high' : 'moderate',
        description: 'Chronic stress can weaken your immune system and contribute to various health issues.',
        relatedSymptoms: ['Anxiety', 'Mood Swings', 'Insomnia'],
        recommendedSupplements: ['Magnesium', 'Ashwagandha'],
        lifestyle_recommendations: ['Stress management techniques', 'Regular exercise', 'Meditation or mindfulness']
      })
    }

    // Immune system concerns
    if (surveyData.currentSymptoms.includes('Frequent Colds') || 
        surveyData.currentSymptoms.includes('Allergies')) {
      concerns.push({
        id: 'immune-system',
        name: 'Weakened Immune System',
        severity: 'moderate',
        description: 'Your immune system may need support to better protect against infections and allergens.',
        relatedSymptoms: ['Frequent Colds', 'Allergies'],
        recommendedSupplements: ['Vitamin D3', 'Vitamin C', 'Zinc'],
        lifestyle_recommendations: ['Adequate sleep', 'Balanced nutrition', 'Regular hand washing']
      })
    }

    // Digestive concerns
    if (surveyData.currentSymptoms.includes('Digestive Problems') || 
        surveyData.currentSymptoms.includes('Bloating')) {
      concerns.push({
        id: 'digestive-health',
        name: 'Digestive Health Issues',
        severity: 'moderate',
        description: 'Digestive issues can affect nutrient absorption and overall health.',
        relatedSymptoms: ['Digestive Problems', 'Bloating'],
        recommendedSupplements: ['Probiotics', 'Digestive Enzymes'],
        lifestyle_recommendations: ['Eat slowly and mindfully', 'Stay hydrated', 'Consider food sensitivities']
      })
    }

    // Joint health concerns
    if (surveyData.currentSymptoms.includes('Joint Pain') || 
        surveyData.medicalConditions.includes('Arthritis')) {
      concerns.push({
        id: 'joint-health',
        name: 'Joint Health Concerns',
        severity: surveyData.medicalConditions.includes('Arthritis') ? 'high' : 'moderate',
        description: 'Joint pain and stiffness may benefit from anti-inflammatory support.',
        relatedSymptoms: ['Joint Pain', 'Muscle Pain'],
        recommendedSupplements: ['Glucosamine', 'Turmeric', 'Omega-3'],
        lifestyle_recommendations: ['Regular low-impact exercise', 'Maintain healthy weight', 'Anti-inflammatory diet']
      })
    }

    return concerns
  }

  private generateSupplementPlan(surveyData: SurveyData, healthConcerns: HealthConcern[]): SupplementRecommendation[] {
    const recommendations: SupplementRecommendation[] = []
    const recommendedSupplements = new Set<string>()

    // Collect all recommended supplements from health concerns
    for (const concern of healthConcerns) {
      for (const supplement of concern.recommendedSupplements) {
        recommendedSupplements.add(supplement)
      }
    }

    // Generate detailed recommendations for each supplement
    Array.from(recommendedSupplements).forEach(supplementName => {
      const supplementInfo = this.supplementDatabase[supplementName]
      if (supplementInfo) {
        // Check for contraindications
        const hasContraindications = supplementInfo.contraindications.some(contra => 
          surveyData.medicalConditions.includes(contra) || 
          surveyData.allergies.includes(contra)
        )

        if (!hasContraindications) {
          const priority = this.determineSupplementPriority(supplementName, healthConcerns)
          const reason = this.generateSupplementReason(supplementName, healthConcerns)

          recommendations.push({
            name: supplementName,
            dosage: supplementInfo.dosage,
            timing: supplementInfo.timing,
            reason: reason,
            priority: priority,
            interactions: supplementInfo.interactions,
            contraindications: supplementInfo.contraindications
          })
        }
      }
    })

    // Add basic supplements for general health
    if (!recommendedSupplements.has('Vitamin D3')) {
      recommendations.push({
        name: 'Vitamin D3',
        dosage: '2000 IU',
        timing: ['morning'],
        reason: 'Essential for bone health, immune function, and overall wellness',
        priority: 'medium'
      })
    }

    if (!recommendedSupplements.has('Omega-3')) {
      recommendations.push({
        name: 'Omega-3',
        dosage: '1000mg',
        timing: ['morning'],
        reason: 'Supports heart health, brain function, and reduces inflammation',
        priority: 'medium'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  private determineSupplementPriority(supplementName: string, healthConcerns: HealthConcern[]): 'high' | 'medium' | 'low' {
    const highPriorityConcerns = healthConcerns.filter(c => c.severity === 'high')
    const moderatePriorityConcerns = healthConcerns.filter(c => c.severity === 'moderate')

    for (const concern of highPriorityConcerns) {
      if (concern.recommendedSupplements.includes(supplementName)) {
        return 'high'
      }
    }

    for (const concern of moderatePriorityConcerns) {
      if (concern.recommendedSupplements.includes(supplementName)) {
        return 'medium'
      }
    }

    return 'low'
  }

  private generateSupplementReason(supplementName: string, healthConcerns: HealthConcern[]): string {
    const reasons: string[] = []
    
    for (const concern of healthConcerns) {
      if (concern.recommendedSupplements.includes(supplementName)) {
        reasons.push(`May help with ${concern.name.toLowerCase()}`)
      }
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Supports overall health and wellness'
  }

  private generateGeneralRecommendations(surveyData: SurveyData): string[] {
    const recommendations: string[] = []

    // Activity level recommendations
    if (surveyData.activityLevel === 'sedentary') {
      recommendations.push('Consider incorporating regular physical activity into your routine')
    }

    // Diet recommendations
    if (surveyData.diet === 'standard') {
      recommendations.push('Consider incorporating more fruits, vegetables, and whole foods into your diet')
    }

    // Sleep recommendations
    if (surveyData.sleepQuality === 'poor' || surveyData.sleepQuality === 'very-poor') {
      recommendations.push('Focus on improving sleep hygiene and establishing a consistent bedtime routine')
    }

    // Stress recommendations
    if (surveyData.stressLevel === 'high' || surveyData.stressLevel === 'very-high') {
      recommendations.push('Consider stress management techniques such as meditation, yoga, or regular exercise')
    }

    // Always include
    recommendations.push('Stay well hydrated by drinking plenty of water throughout the day')
    recommendations.push('Consider regular health check-ups with your healthcare provider')

    return recommendations
  }

  private identifyWarningFlags(surveyData: SurveyData): string[] {
    const warnings: string[] = []

    // Multiple serious conditions
    const seriousConditions = ['Heart Disease', 'Diabetes', 'Kidney Disease', 'Liver Disease', 'Cancer History']
    const hasSeriousConditions = surveyData.medicalConditions.some(condition => 
      seriousConditions.includes(condition)
    )

    if (hasSeriousConditions) {
      warnings.push('You have serious medical conditions. Please consult with your healthcare provider before starting any new supplements.')
    }

    // Multiple medications
    if (surveyData.currentMedications.length > 3) {
      warnings.push('You are taking multiple medications. Please review supplement interactions with your pharmacist or doctor.')
    }

    // Severe symptoms
    const severeSymptoms = ['Depression', 'Severe Fatigue', 'Unexplained Weight Loss']
    const hasSevereSymptoms = surveyData.currentSymptoms.some(symptom => 
      severeSymptoms.includes(symptom)
    )

    if (hasSevereSymptoms) {
      warnings.push('Some of your symptoms may require medical evaluation. Consider consulting with a healthcare provider.')
    }

    return warnings
  }

  private generateFollowUpSuggestions(surveyData: SurveyData, healthConcerns: HealthConcern[]): string[] {
    const suggestions: string[] = []

    // High severity concerns
    const highSeverityConcerns = healthConcerns.filter(c => c.severity === 'high')
    if (highSeverityConcerns.length > 0) {
      suggestions.push('Schedule a consultation with your healthcare provider to discuss your health concerns')
    }

    // Lab work suggestions
    if (surveyData.currentSymptoms.includes('Fatigue') || surveyData.energyLevel === 'very-low') {
      suggestions.push('Consider getting blood work to check for vitamin deficiencies, thyroid function, and complete blood count')
    }

    // Specialist referrals
    if (surveyData.currentSymptoms.includes('Digestive Problems')) {
      suggestions.push('If digestive issues persist, consider consulting with a gastroenterologist')
    }

    if (surveyData.currentSymptoms.includes('Joint Pain')) {
      suggestions.push('For ongoing joint pain, consider consulting with a rheumatologist or orthopedist')
    }

    // Follow-up timeline
    suggestions.push('Re-evaluate your supplement plan in 30-60 days to assess effectiveness')
    suggestions.push('Track your symptoms and energy levels to monitor improvements')

    return suggestions
  }
}

// Export singleton instance
export const healthAnalysisService = new HealthAnalysisService()

// Export mock analysis function for development
export const mockAnalyzeHealth = (surveyData: any): AnalysisResult => {
  // Add artificial delay to simulate AI processing
  return healthAnalysisService.analyzeSurveyData(surveyData)
}