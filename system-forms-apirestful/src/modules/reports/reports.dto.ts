export class AlertDto {
    type: 'warning' | 'error' | 'info';
    category: string;
    title: string;
    message: string;
    data?: any;
}

export class FormSummaryDto {
    formId: string;
    title: string;
    description: string;
    type: string;
    status: string;
    version: number;
    createdBy: string;
    totalResponses: number;
    lastActivity: Date | null;
    periodsCount: number;
    avgSatisfaction: number | null;
    uniqueEvaluatedTechnicians: number;
    hasScaleQuestions: boolean;
    isActive: boolean;
    daysWithoutActivity: number | null;
}

export class FormsListSummaryDto {
    totalForms: number;
    formsWithActivity: number;
    periodicForms: number;
    singleForms: number;
    avgSatisfactionAcrossAllForms: number;
}

export class FormsListResponseDto {
    data: FormSummaryDto[];
    total: number;
    summary: FormsListSummaryDto;
}

export class QuestionTrendDataDto {
    period: string;
    avgRating: number;
    responseCount: number;
}

export class QuestionTrendDto {
    questionId: string;
    questionText: string;
    position: number;
    data: QuestionTrendDataDto[];
    trend: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    currentAvg: number;
    totalResponses: number;
}

export class OverallTrendDto {
    period: string;
    avgRating: number;
    totalResponses: number;
}

export class TrendsDto {
    questionTrends: QuestionTrendDto[];
    overallTrend: OverallTrendDto[];
}

export class TowerSummaryDto {
    towerId: number;
    towerName: string;
    avgRating: number;
    responseCount: number;
    evaluatedTechnicians: number;
    totalTechnicians: number;
    coveragePercentage: number;
    isAboveAverage: boolean;
}

export class EvaluatorSummaryDto {
    evaluatorId: string;
    evaluatorName: string;
    evaluationsCompleted: number;
    assignedTechnicians: number;
    coveragePercentage: number;
    lastEvaluation: Date;
    status: 'compliant' | 'pending';
}

export class FormInfoDto {
    id: string;
    title: string;
    type: string;
    status: string;
}

export class TimeRangeDto {
    months: number;
    periods: string[];
    currentPeriod: string | null;
}

export class FormDashboardResponseDto {
    formInfo: FormInfoDto;
    timeRange: TimeRangeDto;
    trends: TrendsDto;
    towers: TowerSummaryDto[];
    evaluators: EvaluatorSummaryDto[];
    alerts: AlertDto[];
}

// DTOs para los métodos que están en desarrollo
export class PlaceholderResponseDto {
    message: string;
}



//  TOWER ANALYSIS DTOs
export interface TowerAnalysisResponseDto {
  towerInfo: {
    id: number;
    name: string;
    totalTechnicians: number;
    evaluatedTechnicians: number;
    coveragePercentage: number;
  };
  
  performance: {
    avgRating: number;
    totalResponses: number;
    responsesByPeriod: number; // respuestas en el período actual
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
  };
  
  trends: {
    periodData: Array<{
      period: string;
      avgRating: number;
      responseCount: number;
      techniciansEvaluated: number;
    }>;
    changeFromPrevious: number; // % de cambio vs período anterior
    trend: 'improving' | 'declining' | 'stable';
    bestPeriod: string | null;
    worstPeriod: string | null;
  };
  
  technicians: Array<{
    technicianId: string;
    technicianName: string;
    avgRating: number;
    totalEvaluations: number;
    lastEvaluation: Date | null;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    rankInTower: number; // posición dentro de la torre
  }>;
  
  questionBreakdown: Array<{
    questionId: string;
    questionText: string;
    position: number;
    avgRating: number;
    responseCount: number;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
  }>;
  
  insights: Array<{
    type: 'strength' | 'opportunity' | 'alert';
    category: string;
    message: string;
    data?: any;
  }>;
}




//TECHNICIAN ANALYSIS DTOs
export interface TechnicianAnalysisResponseDto {
  technicianInfo: {
    id: string;
    name: string;
    tower: {
      id: number;
      name: string;
    };
    totalEvaluationsReceived: number;
    lastEvaluation: Date | null;
    status: 'active' | 'inactive';
  };
  
  performance: {
    currentAvgRating: number;
    totalResponsesReceived: number;
    responsesByPeriod: number;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    rankInTower: number;
    totalTechniciansInTower: number;
  };
  
  trends: {
    periodData: Array<{
      period: string;
      avgRating: number;
      responseCount: number;
      evaluatorsCount: number;
    }>;
    changeFromPrevious: number;
    trend: 'improving' | 'declining' | 'stable';
    bestPeriod: string | null;
    worstPeriod: string | null;
    consistencyScore: number; // qué tan consistentes son sus calificaciones
  };
  
  questionBreakdown: Array<{
    questionId: string;
    questionText: string;
    position: number;
    avgRating: number;
    responseCount: number;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    isStrength: boolean;
    isWeakness: boolean;
  }>;
  
  evaluators: Array<{
    evaluatorId: string;
    evaluatorName: string;
    avgRatingGiven: number;
    evaluationsCount: number;
    lastEvaluation: Date;
    consistencyWithOthers: 'high' | 'medium' | 'low'; // qué tan similar es su evaluación vs otros
  }>;
  
  towerComparison: {
    positionInTower: number;
    totalInTower: number;
    avgRatingVsTowerAvg: number; // diferencia con promedio de la torre
    performsAboveTowerAverage: boolean;
    topPerformerInTower: boolean;
    bottomPerformerInTower: boolean;
  };
  
  insights: Array<{
    type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
    category: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    data?: any;
  }>;
}



// 👥 EVALUATOR ANALYSIS DTOs
export interface EvaluatorAnalysisResponseDto {
  evaluatorInfo: {
    id: string;
    name: string;
    role: string;
    assignedTechnicians: number;
    totalEvaluationsGiven: number;
    firstEvaluation: Date | null;
    lastEvaluation: Date | null;
    status: 'active' | 'inactive' | 'overdue';
  };
  
  performance: {
    coveragePercentage: number;
    evaluatedTechnicians: number;
    avgResponseTime: number; // días promedio entre evaluaciones
    completionRate: number; // % de períodos donde evaluó
    currentPeriodStatus: 'completed' | 'partial' | 'pending';
    evaluationFrequency: 'high' | 'medium' | 'low';
  };
  
  ratingPatterns: {
    avgRatingGiven: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
      percentage: number;
    }>;
    mostCommonRating: number;
    ratingRange: {
      min: number;
      max: number;
      spread: number;
    };
    evaluationStyle: 'strict' | 'balanced' | 'generous' | 'inconsistent';
    consistencyScore: number; // qué tan consistente es en sus calificaciones
  };
  
  temporalTrends: {
    periodData: Array<{
      period: string;
      techniciansEvaluated: number;
      avgRatingGiven: number;
      evaluationsCount: number;
      coveragePercentage: number;
    }>;
    activityTrend: 'increasing' | 'decreasing' | 'stable';
    ratingTrend: 'becoming_stricter' | 'becoming_generous' | 'stable';
    mostActiveMonth: string | null;
    leastActiveMonth: string | null;
  };
  
  techniciansEvaluated: Array<{
    technicianId: string;
    technicianName: string;
    towerName: string;
    avgRatingGiven: number;
    evaluationsCount: number;
    lastEvaluation: Date;
    ratingConsistency: 'high' | 'medium' | 'low';
    comparedToOthers: 'above_average' | 'average' | 'below_average'; // vs otros evaluadores del mismo técnico
  }>;
  
  questionBreakdown: Array<{
    questionId: string;
    questionText: string;
    position: number;
    avgRatingGiven: number;
    responseCount: number;
    isStrictestQuestion: boolean; // pregunta donde es más estricto
    isGenerousQuestion: boolean; // pregunta donde es más generoso
  }>;
  
  comparisonWithPeers: {
    avgRatingVsPeers: number; // diferencia con promedio de otros evaluadores
    coverageVsPeers: number; // diferencia en cobertura
    activityVsPeers: number; // diferencia en actividad
    isStricterThanPeers: boolean;
    isMoreActiveThanPeers: boolean;
    rankInCoverage: number; // posición entre evaluadores por cobertura
    totalEvaluators: number;
  };
  
  insights: Array<{
    type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
    category: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean; // si requiere acción inmediata
    data?: any;
  }>;
}







//  TOWERS COMPARISON DTOs
export interface TowersComparisonResponseDto {
  overview: {
    totalTowers: number;
    evaluationPeriod: string;
    totalTechnicians: number;
    totalEvaluationsCompleted: number;
    overallAvgRating: number;
    lastUpdated: Date;
  };
  
  ranking: Array<{
    position: number;
    towerId: number;
    towerName: string;
    avgRating: number;
    totalTechnicians: number;
    evaluatedTechnicians: number;
    coveragePercentage: number;
    totalResponses: number;
    performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
    changeFromPrevious: number | null; // vs período anterior
    trend: 'improving' | 'declining' | 'stable' | 'new';
  }>;
  
  performanceDistribution: {
    excellent: {
      count: number;
      towers: string[];
      percentage: number;
    };
    good: {
      count: number;
      towers: string[];
      percentage: number;
    };
    average: {
      count: number;
      towers: string[];
      percentage: number;
    };
    needs_improvement: {
      count: number;
      towers: string[];
      percentage: number;
    };
  };
  
  coverageAnalysis: {
    fullCoverage: string[]; // torres con 100% cobertura
    partialCoverage: string[]; // torres con 70-99% cobertura
    lowCoverage: string[]; // torres con <70% cobertura
    avgCoverageByTower: Array<{
      towerName: string;
      coveragePercentage: number;
    }>;
  };
  
  topPerformers: Array<{
    category: 'highest_rated' | 'most_improved' | 'best_coverage' | 'most_consistent';
    towerName: string;
    value: number;
    description: string;
  }>;
  
  questionBreakdown: Array<{
    questionId: string;
    questionText: string;
    position: number;
    overallAvgRating: number;
    towerPerformance: Array<{
      towerName: string;
      avgRating: number;
      isStrongest: boolean; // torre que mejor se desempeña en esta pregunta
      isWeakest: boolean; // torre que peor se desempeña en esta pregunta
    }>;
    performanceGap: number; // diferencia entre mejor y peor torre
  }>;
  
  insights: Array<{
    type: 'strength' | 'opportunity' | 'alert' | 'recommendation';
    category: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    affectedTowers: string[];
    data?: any;
  }>;
  
  recommendations: Array<{
    type: 'best_practice' | 'improvement_action' | 'attention_needed';
    title: string;
    description: string;
    targetTowers: string[];
    benchmarkTower: string | null; // torre a seguir como ejemplo
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface TopPerformer {
    category: 'highest_rated' | 'best_coverage' | 'most_consistent' | 'most_improved';
    towerName: string;
    value: number;
    description: string;
}





