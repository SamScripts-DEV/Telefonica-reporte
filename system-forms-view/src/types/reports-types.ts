// ======================================================================================
// 📊 SISTEMA DE REPORTES AVANZADO - TELEFÓNICA
// ======================================================================================

export interface FormsListResponseDto {
  data: Array<{
    formId: string
    title: string
    description: string
    type: "periodic" | "single"
    status: "active" | "inactive"
    version: number
    createdBy: string
    totalResponses: number
    lastActivity: Date | null
    periodsCount: number
    avgSatisfaction: number | null
    uniqueEvaluatedTechnicians: number
    hasScaleQuestions: boolean
    isActive: boolean
    daysWithoutActivity: number | null
  }>
  total: number
  summary: {
    totalForms: number
    formsWithActivity: number
    periodicForms: number
    singleForms: number
    avgSatisfactionAcrossAllForms: number
  }
}

export interface FormDashboardResponseDto {
  formInfo: {
    id: string
    title: string
    type: "periodic" | "single"
    status: "active" | "inactive"
  }
  timeRange: {
    months: number
    periods: string[]
    currentPeriod: string | null
  }
  trends: {
    questionTrends: Array<{
      questionId: string
      questionText: string
      position: number
      data: Array<{
        period: string
        avgRating: number
        responseCount: number
      }>
      trend: "improving" | "declining" | "stable"
      changePercentage: number
      currentAvg: number
      totalResponses: number
    }>
    overallTrend: Array<{
      period: string
      avgRating: number
      totalResponses: number
    }>
  }
  towers: Array<{
    towerId: number
    towerName: string
    avgRating: number
    responseCount: number
    evaluatedTechnicians: number
    totalTechnicians: number
    coveragePercentage: number
    isAboveAverage: boolean
  }>
  evaluators: Array<{
    evaluatorId: string
    evaluatorName: string
    evaluationsCompleted: number
    assignedTechnicians: number
    evaluatedTechnicians: number
    coveragePercentage: number
    lastEvaluation: Date
    status: "compliant" | "pending"
  }>
  alerts: Array<{
    type: "warning" | "info" | "error"
    category: "satisfaction" | "coverage" | "activity"
    title: string
    message: string
    data?: any
  }>
}

export interface TowerAnalysisResponseDto {
  towerInfo: {
    id: number
    name: string
    totalTechnicians: number
    evaluatedTechnicians: number
    coveragePercentage: number
  }
  performance: {
    avgRating: number
    totalResponses: number
    responsesByPeriod: number
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
  }
  trends: {
    periodData: Array<{
      period: string
      avgRating: number
      responseCount: number
      techniciansEvaluated: number
    }>
    changeFromPrevious: number
    trend: "improving" | "declining" | "stable"
    bestPeriod: string | null
    worstPeriod: string | null
  }
  technicians: Array<{
    technicianId: string
    technicianName: string
    avgRating: number
    totalEvaluations: number
    lastEvaluation: Date | null
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
    rankInTower: number
  }>
  questionBreakdown: Array<{
    questionId: string
    questionText: string
    position: number
    avgRating: number
    responseCount: number
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
  }>
  insights: Array<{
    type: "strength" | "opportunity" | "alert"
    category: string
    message: string
    data?: any
  }>
}

export interface TechnicianAnalysisResponseDto {
  technicianInfo: {
    id: string
    name: string
    tower: {
      id: number
      name: string
    }
    totalEvaluationsReceived: number
    lastEvaluation: Date | null
    status: "active" | "inactive"
  }
  performance: {
    currentAvgRating: number
    totalResponsesReceived: number
    responsesByPeriod: number
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
    rankInTower: number
    totalTechniciansInTower: number
  }
  trends: {
    periodData: Array<{
      period: string
      avgRating: number
      responseCount: number
      evaluatorsCount: number
    }>
    changeFromPrevious: number
    trend: "improving" | "declining" | "stable"
    bestPeriod: string | null
    worstPeriod: string | null
    consistencyScore: number
  }
  questionBreakdown: Array<{
    questionId: string
    questionText: string
    position: number
    avgRating: number
    responseCount: number
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
    isStrength: boolean
    isWeakness: boolean
  }>
  evaluators: Array<{
    evaluatorId: string
    evaluatorName: string
    avgRatingGiven: number
    evaluationsCount: number
    lastEvaluation: Date
    consistencyWithOthers: "high" | "medium" | "low"
  }>
  towerComparison: {
    positionInTower: number
    totalInTower: number
    avgRatingVsTowerAvg: number
    performsAboveTowerAverage: boolean
    topPerformerInTower: boolean
    bottomPerformerInTower: boolean
  }
  insights: Array<{
    type: "strength" | "opportunity" | "alert" | "recommendation"
    category: string
    message: string
    priority: "high" | "medium" | "low"
    data?: any
  }>
}

export interface EvaluatorAnalysisResponseDto {
  evaluatorInfo: {
    id: string
    name: string
    role: string
    assignedTechnicians: number
    totalEvaluationsGiven: number
    firstEvaluation: Date | null
    lastEvaluation: Date | null
    status: "active" | "inactive" | "overdue"
  }
  performance: {
    coveragePercentage: number
    evaluatedTechnicians: number
    avgResponseTime: number
    completionRate: number
    currentPeriodStatus: "completed" | "partial" | "pending"
    evaluationFrequency: "high" | "medium" | "low"
  }
  ratingPatterns: {
    avgRatingGiven: number
    ratingDistribution: Array<{
      rating: number
      count: number
      percentage: number
    }>
    mostCommonRating: number
    ratingRange: {
      min: number
      max: number
      spread: number
    }
    evaluationStyle: "strict" | "balanced" | "generous" | "inconsistent"
    consistencyScore: number
  }
  temporalTrends: {
    periodData: Array<{
      period: string
      techniciansEvaluated: number
      avgRatingGiven: number
      evaluationsCount: number
      coveragePercentage: number
    }>
    activityTrend: "increasing" | "decreasing" | "stable"
    ratingTrend: "becoming_stricter" | "becoming_generous" | "stable"
    mostActiveMonth: string | null
    leastActiveMonth: string | null
  }
  techniciansEvaluated: Array<{
    technicianId: string
    technicianName: string
    towerName: string
    avgRatingGiven: number
    evaluationsCount: number
    lastEvaluation: Date
    ratingConsistency: "high" | "medium" | "low"
    comparedToOthers: "above_average" | "average" | "below_average"
  }>
  questionBreakdown: Array<{
    questionId: string
    questionText: string
    position: number
    avgRatingGiven: number
    responseCount: number
    isStrictestQuestion: boolean
    isGenerousQuestion: boolean
  }>
  comparisonWithPeers: {
    avgRatingVsPeers: number
    coverageVsPeers: number
    activityVsPeers: number
    isStricterThanPeers: boolean
    isMoreActiveThanPeers: boolean
    rankInCoverage: number
    totalEvaluators: number
  }
  insights: Array<{
    type: "strength" | "opportunity" | "alert" | "recommendation"
    category: string
    message: string
    priority: "high" | "medium" | "low"
    actionable: boolean
    data?: any
  }>
}

export interface TowersComparisonResponseDto {
  overview: {
    totalTowers: number
    evaluationPeriod: string
    totalTechnicians: number
    totalEvaluationsCompleted: number
    overallAvgRating: number
    lastUpdated: Date
  }
  ranking: Array<{
    position: number
    towerId: number
    towerName: string
    avgRating: number
    totalTechnicians: number
    evaluatedTechnicians: number
    coveragePercentage: number
    totalResponses: number
    performanceLevel: "excellent" | "good" | "average" | "needs_improvement"
    changeFromPrevious: number | null
    trend: "improving" | "declining" | "stable" | "new"
  }>
  performanceDistribution: {
    excellent: { count: number; towers: string[]; percentage: number }
    good: { count: number; towers: string[]; percentage: number }
    average: { count: number; towers: string[]; percentage: number }
    needs_improvement: { count: number; towers: string[]; percentage: number }
  }
  coverageAnalysis: {
    fullCoverage: string[]
    partialCoverage: string[]
    lowCoverage: string[]
    avgCoverageByTower: Array<{
      towerName: string
      coveragePercentage: number
    }>
  }
  topPerformers: Array<{
    category: "highest_rated" | "most_improved" | "best_coverage" | "most_consistent"
    towerName: string
    value: number
    description: string
  }>
  questionBreakdown: Array<{
    questionId: string
    questionText: string
    position: number
    overallAvgRating: number
    towerPerformance: Array<{
      towerName: string
      avgRating: number
      isStrongest: boolean
      isWeakest: boolean
    }>
    performanceGap: number
  }>
  insights: Array<{
    type: "strength" | "opportunity" | "alert" | "recommendation"
    category: string
    message: string
    priority: "high" | "medium" | "low"
    affectedTowers: string[]
    data?: any
  }>
  recommendations: Array<{
    type: "best_practice" | "improvement_action" | "attention_needed"
    title: string
    description: string
    targetTowers: string[]
    benchmarkTower: string | null
    priority: "high" | "medium" | "low"
  }>
}

// Performance levels helper
export type PerformanceLevel = "excellent" | "good" | "average" | "needs_improvement"
export type TrendDirection = "improving" | "declining" | "stable"
export type InsightType = "strength" | "opportunity" | "alert" | "recommendation"
export type Priority = "high" | "medium" | "low"
