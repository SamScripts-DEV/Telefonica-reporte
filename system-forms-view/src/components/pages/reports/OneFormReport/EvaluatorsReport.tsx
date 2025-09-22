"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "../components/Metric-card"
import { InsightBadge } from "../components/Insight-badge"
import { TrendChart } from "../components/Trend-chart"
import { RankingTable } from "../components/Ranking-table"
import { ProgressBar } from "../components/Progress-bar"
import { ArrowLeft, UserCheck, TrendingUp, Users, Star, Activity, Award, AlertTriangle, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { EvaluatorAnalysisResponseDto } from "@/types/reports-types"
import { getEvaluatorAnalysis } from "@/api/reports/reports-endpoints"
import { MonthSelector } from "@/components/ui/month-selector"

interface EvaluatorAnalysisPageProps {
    params: {
        id: string
        evaluatorId: string
    }
    initialData?: EvaluatorAnalysisResponseDto | null
}

export default function EvaluatorAnalysisPage({ params, initialData }: EvaluatorAnalysisPageProps) {
    const { id, evaluatorId } = params
    const router = useRouter()
    const { user, isAuthenticated, checkAuth } = useAuth()
    const { toast } = useToast()

    const [evaluatorData, setEvaluatorData] = useState<EvaluatorAnalysisResponseDto | null>(initialData || null)
    const [loading, setLoading] = useState(!initialData)
    const [selectedMonths, setSelectedMonths] = useState("6")


    const loadEvaluatorData = async (months: string = selectedMonths) => {
        try {
            setLoading(true)
            const data = await getEvaluatorAnalysis(id, evaluatorId, { months })
            setEvaluatorData(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos del evaluador.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleMonthsChange = (months: string) => {
        setSelectedMonths(months)

        if (months !== "6" || !initialData) {
            loadEvaluatorData(months)
        }
    }

    useEffect(() => {
        if (!initialData) {
            loadEvaluatorData()
        }
    },[initialData])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "text-green-600"
            case "partial":
                return "text-yellow-600"
            case "pending":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "completed":
                return "Completado"
            case "partial":
                return "Parcial"
            case "pending":
                return "Pendiente"
            default:
                return "Sin datos"
        }
    }

    const getEvaluationStyleText = (style: string) => {
        switch (style) {
            case "strict":
                return "Estricto"
            case "balanced":
                return "Equilibrado"
            case "generous":
                return "Generoso"
            case "inconsistent":
                return "Inconsistente"
            default:
                return "Sin datos"
        }
    }


    if (!evaluatorData) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="max-w-7xl mx-auto p-6">
                    <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
                        <CardContent>
                            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Evaluador no encontrado</CardTitle>
                            <CardDescription className="text-gray-600 mb-6">
                                No se pudo cargar la información del evaluador solicitado.
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
                                <UserCheck className="mr-3 h-8 w-8 text-blue-600" />
                                {evaluatorData.evaluatorInfo.name}
                            </h1>
                            <p className="text-gray-600">
                                {evaluatorData.evaluatorInfo.role} • Análisis de patrones de evaluación
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <MonthSelector
                            value={selectedMonths}
                            onValueChange={handleMonthsChange}
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Insights */}
                {evaluatorData.insights.length > 0 && (
                    <Card className="shadow-lg border-gray-200 bg-white mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                                {evaluatorData.insights.map((insight, index) => (
                                    <InsightBadge key={index} type={insight.type} priority={insight.priority} message={insight.message} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Cobertura"
                        value={`${evaluatorData.performance.coveragePercentage}%`}
                        subtitle={`${evaluatorData.performance.evaluatedTechnicians}/${evaluatorData.evaluatorInfo.assignedTechnicians} técnicos`}
                        icon={Users}
                        variant={evaluatorData.performance.coveragePercentage >= 90 ? "success" : "warning"}
                    />
                    <MetricCard
                        title="Evaluaciones Realizadas"
                        value={evaluatorData.evaluatorInfo.totalEvaluationsGiven}
                        subtitle="Total histórico"
                        icon={Activity}
                        variant="default"
                    />
                    <MetricCard
                        title="Promedio Otorgado"
                        value={evaluatorData.ratingPatterns.avgRatingGiven.toFixed(1)}
                        subtitle={getEvaluationStyleText(evaluatorData.ratingPatterns.evaluationStyle)}
                        icon={Star}
                        variant="default"
                    />
                    <MetricCard
                        title="Consistencia"
                        value={`${evaluatorData.ratingPatterns.consistencyScore}%`}
                        subtitle="Estabilidad en criterios"
                        icon={Award}
                        variant={evaluatorData.ratingPatterns.consistencyScore >= 80 ? "success" : "warning"}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Activity Trend */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                                Actividad y Cobertura
                            </CardTitle>
                            <CardDescription className="text-gray-600">Evolución de evaluaciones por período</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TrendChart
                                data={evaluatorData.temporalTrends.periodData.map((item) => ({
                                    period: item.period,
                                    value: item.coveragePercentage,
                                    responses: item.evaluationsCount,
                                }))}
                                height={300}
                                showResponses={true}
                            />
                        </CardContent>
                    </Card>

                    {/* Rating Distribution */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                                Distribución de Calificaciones
                            </CardTitle>
                            <CardDescription className="text-gray-600">Patrón de calificaciones otorgadas</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {evaluatorData.ratingPatterns.ratingDistribution.map((rating) => (
                                    <div key={rating.rating} className="flex items-center space-x-3">
                                        <div className="w-12 text-sm font-medium text-gray-700">{rating.rating} ⭐</div>
                                        <div className="flex-1">
                                            <ProgressBar
                                                value={rating.percentage}
                                                max={100}
                                                variant={rating.rating >= 4 ? "success" : rating.rating >= 3 ? "default" : "warning"}
                                            />
                                        </div>
                                        <div className="w-16 text-right text-sm text-gray-600">{rating.percentage.toFixed(1)}%</div>
                                        <div className="w-12 text-right text-xs text-gray-500">({rating.count})</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600">
                                    <strong>Calificación más común:</strong> {evaluatorData.ratingPatterns.mostCommonRating} estrellas
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Technicians Evaluated */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <Users className="mr-2 h-5 w-5 text-purple-600" />
                                Técnicos Evaluados
                            </CardTitle>
                            <CardDescription className="text-gray-600">Calificaciones otorgadas por técnico</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RankingTable
                                data={evaluatorData.techniciansEvaluated.map((technician, index) => ({
                                    rank: index + 1,
                                    name: technician.technicianName,
                                    score: technician.avgRatingGiven,
                                    subtitle: `${technician.evaluationsCount} evaluaciones • ${technician.towerName}`,
                                    badge:
                                        technician.comparedToOthers === "above_average"
                                            ? "success"
                                            : technician.comparedToOthers === "average"
                                                ? "warning"
                                                : "error",
                                    badgeText:
                                        technician.comparedToOthers === "above_average"
                                            ? "Sobre promedio"
                                            : technician.comparedToOthers === "average"
                                                ? "Promedio"
                                                : "Bajo promedio",
                                    onClick: () => router.push(`/reports/${id}/technicians/${technician.technicianId}`),
                                }))}
                            />
                        </CardContent>
                    </Card>

                    {/* Question Analysis */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Análisis por Pregunta</CardTitle>
                            <CardDescription className="text-gray-600">
                                Patrones de calificación por área evaluada
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {evaluatorData.questionBreakdown.map((question) => (
                                    <div key={question.questionId} className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 pr-4">
                                                <h4 className="font-medium text-gray-900 text-sm flex items-center">
                                                    {question.questionText}
                                                    {question.isStrictestQuestion && (
                                                        <InsightBadge type="alert" priority="low" message="Más estricto" className="ml-2" />
                                                    )}
                                                    {question.isGenerousQuestion && (
                                                        <InsightBadge type="opportunity" priority="low" message="Más generoso" className="ml-2" />
                                                    )}
                                                </h4>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-gray-900">
                                                    {question.avgRatingGiven.toFixed(1)}
                                                </span>
                                                <div className="text-xs text-gray-500">{question.responseCount} respuestas</div>
                                            </div>
                                        </div>
                                        <ProgressBar value={question.avgRatingGiven} max={5} variant="default" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
