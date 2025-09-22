"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "../components/Metric-card"
import { InsightBadge } from "../components/Insight-badge"
import { ProgressBar } from "../components/Progress-bar"
import { ArrowLeft, Building, Users, Star, Activity, Award, AlertTriangle, BarChart3, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TowersComparisonResponseDto } from "@/types/reports-types"
import { getTowersComparison } from "@/api/reports/reports-endpoints"
import { PeriodSelector } from "@/components/ui/period-selector"

interface TowersComparisonPageProps {
    params: {
        id: string
    }
    initialData?: TowersComparisonResponseDto | null
}

export default function TowersComparisonPage({ params, initialData }: TowersComparisonPageProps) {
    const { id } = params
    const router = useRouter()
    const { user, isAuthenticated, checkAuth } = useAuth()
    const { toast } = useToast()



    const [comparisonData, setComparisonData] = useState<TowersComparisonResponseDto | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)

    const getDefaultPeriod = (): string => {
        const now = new Date()
        const currentDay = now.getDate()

        let targetDate: Date

        if (currentDay <= 5) {
            // Días 1-5: mes anterior al anterior
            targetDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        } else {
            // Días 6-31: mes anterior
            targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        }

        const year = targetDate.getFullYear()
        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0')

        return `${year}-${month}`
    }
    const [selectedPeriod, setSelectedPeriod] = useState(getDefaultPeriod())


    const loadComparisonData = async (period: string = selectedPeriod) => {
        try {
            setLoading(true)
            const data = await getTowersComparison(id, { period })
            setComparisonData(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos de comparación.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period)
        loadComparisonData(period)
    }

    useEffect(() => {
        if (!initialData) {
            loadComparisonData()
        }
    }, [initialData])

    const getPerformanceLevelColor = (level: string) => {
        switch (level) {
            case "excellent":
                return "text-green-600"
            case "good":
                return "text-blue-600"
            case "average":
                return "text-yellow-600"
            case "needs_improvement":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "improving":
                return "📈"
            case "declining":
                return "📉"
            case "stable":
                return "➡️"
            default:
                return "❓"
        }
    }



    if (!comparisonData) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto p-6">
                    <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
                        <CardContent>
                            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Datos no disponibles</CardTitle>
                            <CardDescription className="text-gray-600 mb-6">
                                No se pudieron cargar los datos de comparación entre torres.
                            </CardDescription>
                            <Button
                                onClick={() => router.push(`/reports/${id}`)}
                                className="bg-blue-700 hover:bg-blue-800 text-white"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <Button variant="ghost" onClick={() => router.push(`/reports/${id}`)} className="mr-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <Building className="mr-3 h-8 w-8 text-blue-600" />
                                Comparación entre Torres
                            </h1>
                            <p className="text-gray-600">Análisis comparativo de performance y tendencias</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <PeriodSelector
                            value={selectedPeriod}
                            onValueChange={handlePeriodChange}
                            disabled={loading}
                            placeholder="Seleccionar período"
                        />
                    </div>
                </div>

                {/* Insights */}
                {comparisonData.insights.length > 0 && (
                    <Card className="shadow-lg border-gray-200 bg-white mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {comparisonData.insights.map((insight, index) => (
                                    <InsightBadge key={index} type={insight.type} priority={insight.priority} message={insight.message} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Torres Evaluadas"
                        value={comparisonData.overview.totalTowers}
                        subtitle="Total en análisis"
                        icon={Building}
                        variant="default"
                    />
                    <MetricCard
                        title="Técnicos Totales"
                        value={comparisonData.overview.totalTechnicians}
                        subtitle="Across all towers"
                        icon={Users}
                        variant="default"
                    />
                    <MetricCard
                        title="Evaluaciones Completadas"
                        value={comparisonData.overview.totalEvaluationsCompleted}
                        subtitle="En el período"
                        icon={Activity}
                        variant="default"
                    />
                    <MetricCard
                        title="Promedio General"
                        value={comparisonData.overview.overallAvgRating.toFixed(1)}
                        subtitle="Todas las torres"
                        icon={Star}
                        variant="default"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Ranking */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-lg border-gray-200 bg-white">
                            <CardHeader>
                                <CardTitle className="text-gray-900 flex items-center">
                                    <Trophy className="mr-2 h-5 w-5 text-yellow-600" />
                                    Ranking de Torres
                                </CardTitle>
                                <CardDescription className="text-gray-600">
                                    Ordenado por calificación promedio en {selectedPeriod}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {comparisonData.ranking.map((tower) => (
                                        <div
                                            key={tower.towerId}
                                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/reports/${id}/towers/${tower.towerId}`)}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                                                    <span className="font-bold text-gray-700">#{tower.position}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{tower.towerName}</h4>
                                                    <p className="text-sm text-gray-600">
                                                        {tower.evaluatedTechnicians}/{tower.totalTechnicians} técnicos • {tower.totalResponses}{" "}
                                                        evaluaciones
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-lg text-gray-900">{tower.avgRating.toFixed(1)}</div>
                                                    <div className={`text-xs ${getPerformanceLevelColor(tower.performanceLevel)}`}>
                                                        {tower.performanceLevel}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-700">{tower.coveragePercentage}%</div>
                                                    <div className="text-xs text-gray-500">cobertura</div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-lg">{getTrendIcon(tower.trend)}</span>
                                                    <span
                                                        className={`text-sm font-medium ${tower.changeFromPrevious && tower.changeFromPrevious > 0
                                                            ? "text-green-600"
                                                            : tower.changeFromPrevious && tower.changeFromPrevious < 0
                                                                ? "text-red-600"
                                                                : "text-gray-600"
                                                            }`}
                                                    >
                                                        {tower.changeFromPrevious
                                                            ? `${tower.changeFromPrevious > 0 ? "+" : ""}${tower.changeFromPrevious.toFixed(1)}%`
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Distribution */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                                Distribución de Performance
                            </CardTitle>
                            <CardDescription className="text-gray-600">Torres por nivel de desempeño</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm font-medium text-green-800">Excelente</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {comparisonData.performanceDistribution.excellent.count}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-sm font-medium text-blue-800">Bueno</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {comparisonData.performanceDistribution.good.count}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                    <span className="text-sm font-medium text-yellow-800">Regular</span>
                                    <span className="text-lg font-bold text-yellow-600">
                                        {comparisonData.performanceDistribution.average.count}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                    <span className="text-sm font-medium text-red-800">Necesita Mejora</span>
                                    <span className="text-lg font-bold text-red-600">
                                        {comparisonData.performanceDistribution.needs_improvement.count}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Question Breakdown */}
                <Card className="shadow-lg border-gray-200 bg-white mb-8">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Performance por Pregunta</CardTitle>
                        <CardDescription className="text-gray-600">
                            Comparación detallada por área de evaluación
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {comparisonData.questionBreakdown.map((question) => (
                                <div key={question.questionId} className="border-b border-gray-100 pb-6 last:border-b-0">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-medium text-gray-900">{question.questionText}</h4>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-gray-900">
                                                {question.overallAvgRating.toFixed(1)}
                                            </span>
                                            <div className="text-xs text-gray-500">Promedio general</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {question.towerPerformance.map((tower) => (
                                            <div key={tower.towerName} className="p-3 border border-gray-100 rounded-lg">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-gray-700">{tower.towerName}</span>
                                                    <div className="flex space-x-1">
                                                        {tower.isStrongest && <span className="text-green-500">🏆</span>}
                                                        {tower.isWeakest && <span className="text-red-500">⚠️</span>}
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900 mb-2">{tower.avgRating.toFixed(1)}</div>
                                                <ProgressBar
                                                    value={tower.avgRating}
                                                    max={5}
                                                    variant={tower.isStrongest ? "success" : tower.isWeakest ? "error" : "default"}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 text-sm text-gray-600">
                                        <strong>Brecha de performance:</strong> {question.performanceGap.toFixed(1)} puntos entre la mejor y
                                        peor torre
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="shadow-lg border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle className="text-gray-900 flex items-center">
                            <Award className="mr-2 h-5 w-5 text-purple-600" />
                            Recomendaciones
                        </CardTitle>
                        <CardDescription className="text-gray-600">Acciones sugeridas basadas en el análisis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {comparisonData.recommendations.map((recommendation, index) => (
                                <div key={index} className="p-4 border border-gray-100 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                                        <InsightBadge
                                            type={recommendation.type === "attention_needed" ? "alert" : "recommendation"}
                                            priority={recommendation.priority}
                                            message={recommendation.priority.toUpperCase()}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs text-gray-500">Torres objetivo:</span>
                                        {recommendation.targetTowers.map((tower) => (
                                            <span key={tower} className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                                                {tower}
                                            </span>
                                        ))}
                                        {recommendation.benchmarkTower && (
                                            <>
                                                <span className="text-xs text-gray-500 ml-2">Benchmark:</span>
                                                <span className="px-2 py-1 bg-green-100 text-xs text-green-700 rounded">
                                                    {recommendation.benchmarkTower}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
