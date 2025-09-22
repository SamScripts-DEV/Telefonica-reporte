"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MetricCard } from "../components/Metric-card"
import { InsightBadge } from "../components/Insight-badge"
import { TrendChart } from "../components/Trend-chart"
import { RankingTable } from "../components/Ranking-table"
import { ProgressBar } from "../components/Progress-bar"
import { ArrowLeft, User, TrendingUp, Users, Star, Activity, Award, AlertTriangle, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TechnicianAnalysisResponseDto } from "@/types/reports-types"
import { getTechnicianAnalysis } from "@/api/reports/reports-endpoints"
import { MonthSelector } from "@/components/ui/month-selector"

interface TechnicianAnalysisPageProps {
  params: {
    id: string
    technicianId: string
  }
    initialData?: TechnicianAnalysisResponseDto | null
}

export default function TechnicianAnalysisPage({ params, initialData }: TechnicianAnalysisPageProps) {
  const { id, technicianId } = params
  const router = useRouter()
  const { user, isAuthenticated, checkAuth } = useAuth()
  const { toast } = useToast()

  const [technicianData, setTechnicianData] = useState<TechnicianAnalysisResponseDto | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [selectedMonths, setSelectedMonths] = useState("6")


  const loadTechnicianData = async (months: string = selectedMonths) => {
    try {
      setLoading(true)
      const data = await getTechnicianAnalysis(id, technicianId, { months})
      setTechnicianData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del técnico.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMonthsChange = (months: string) => {
    setSelectedMonths(months)

    if (months !== "6" ||!initialData){
        loadTechnicianData(months)
    }
  }

  useEffect(() => {
    if (!initialData) {
        loadTechnicianData()
    }
  },[initialData])

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

  const getPerformanceLevelText = (level: string) => {
    switch (level) {
      case "excellent":
        return "Excelente"
      case "good":
        return "Bueno"
      case "average":
        return "Regular"
      case "needs_improvement":
        return "Necesita Mejora"
      default:
        return "Sin datos"
    }
  }


  if (!technicianData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
            <CardContent>
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Técnico no encontrado</CardTitle>
              <CardDescription className="text-gray-600 mb-6">
                No se pudo cargar la información del técnico solicitado.
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
                <User className="mr-3 h-8 w-8 text-blue-600" />
                {technicianData.technicianInfo.name}
              </h1>
              <p className="text-gray-600 flex items-center">
                <Building className="mr-2 h-4 w-4" />
                {technicianData.technicianInfo.tower.name} • Análisis individual de performance
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
        {technicianData.insights.length > 0 && (
          <Card className="shadow-lg border-gray-200 bg-white mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {technicianData.insights.map((insight, index) => (
                  <InsightBadge key={index} type={insight.type} priority={insight.priority} message={insight.message} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Calificación Promedio"
            value={technicianData.performance.currentAvgRating.toFixed(1)}
            subtitle={getPerformanceLevelText(technicianData.performance.performanceLevel)}
            icon={Star}
            trend={
              technicianData.trends.changeFromPrevious > 0
                ? "up"
                : technicianData.trends.changeFromPrevious < 0
                  ? "down"
                  : "stable"
            }
            trendValue={`${technicianData.trends.changeFromPrevious > 0 ? "+" : ""}${technicianData.trends.changeFromPrevious.toFixed(1)}%`}
            variant={technicianData.performance.performanceLevel === "excellent" ? "success" : "default"}
          />
          <MetricCard
            title="Evaluaciones Recibidas"
            value={technicianData.performance.totalResponsesReceived}
            subtitle={`${technicianData.performance.responsesByPeriod} este período`}
            icon={Activity}
            variant="default"
          />
          <MetricCard
            title="Posición en Torre"
            value={`#${technicianData.performance.rankInTower}`}
            subtitle={`de ${technicianData.performance.totalTechniciansInTower} técnicos`}
            icon={Award}
            variant={technicianData.performance.rankInTower <= 3 ? "success" : "default"}
          />
          <MetricCard
            title="Consistencia"
            value={`${technicianData.trends.consistencyScore}%`}
            subtitle="Estabilidad en calificaciones"
            icon={TrendingUp}
            variant={technicianData.trends.consistencyScore >= 80 ? "success" : "warning"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                Evolución de Performance
              </CardTitle>
              <CardDescription className="text-gray-600">Tendencia de calificaciones por período</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart
                data={technicianData.trends.periodData.map((item) => ({
                  period: item.period,
                  value: item.avgRating,
                  responses: item.responseCount,
                }))}
                height={300}
              />
            </CardContent>
          </Card>

          {/* Question Breakdown */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Desglose por Área</CardTitle>
              <CardDescription className="text-gray-600">
                Performance detallado por pregunta evaluada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianData.questionBreakdown.map((question) => (
                  <div key={question.questionId} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <h4 className="font-medium text-gray-900 text-sm flex items-center">
                          {question.questionText}
                          {question.isStrength && (
                            <InsightBadge type="strength" priority="low" message="Fortaleza" className="ml-2" />
                          )}
                          {question.isWeakness && (
                            <InsightBadge type="alert" priority="low" message="Área de mejora" className="ml-2" />
                          )}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{question.avgRating.toFixed(1)}</span>
                        <div className={`text-xs ${getPerformanceLevelColor(question.performanceLevel)}`}>
                          {getPerformanceLevelText(question.performanceLevel)}
                        </div>
                      </div>
                    </div>
                    <ProgressBar
                      value={question.avgRating}
                      max={5}
                      variant={
                        question.performanceLevel === "excellent"
                          ? "success"
                          : question.performanceLevel === "good"
                            ? "default"
                            : question.performanceLevel === "average"
                              ? "warning"
                              : "error"
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluators */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Users className="mr-2 h-5 w-5 text-green-600" />
                Evaluadores
              </CardTitle>
              <CardDescription className="text-gray-600">Calificaciones recibidas por evaluador</CardDescription>
            </CardHeader>
            <CardContent>
              <RankingTable
                data={technicianData.evaluators.map((evaluator, index) => ({
                  rank: index + 1,
                  name: evaluator.evaluatorName,
                  score: evaluator.avgRatingGiven,
                  subtitle: `${evaluator.evaluationsCount} evaluaciones`,
                  badge:
                    evaluator.consistencyWithOthers === "high"
                      ? "success"
                      : evaluator.consistencyWithOthers === "medium"
                        ? "warning"
                        : "error",
                  badgeText:
                    evaluator.consistencyWithOthers === "high"
                      ? "Alta consistencia"
                      : evaluator.consistencyWithOthers === "medium"
                        ? "Media consistencia"
                        : "Baja consistencia",
                  onClick: () => router.push(`/reports/${id}/evaluators/${evaluator.evaluatorId}`),
                }))}
              />
            </CardContent>
          </Card>

          {/* Tower Comparison */}
          <Card className="shadow-lg border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <Building className="mr-2 h-5 w-5 text-purple-600" />
                Comparación con Torre
              </CardTitle>
              <CardDescription className="text-gray-600">
                Posición relativa en {technicianData.technicianInfo.tower.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Posición en Torre</span>
                  <span className="text-lg font-bold text-gray-900">
                    #{technicianData.towerComparison.positionInTower} de {technicianData.towerComparison.totalInTower}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">vs. Promedio Torre</span>
                  <span
                    className={`text-lg font-bold ${technicianData.towerComparison.avgRatingVsTowerAvg > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {technicianData.towerComparison.avgRatingVsTowerAvg > 0 ? "+" : ""}
                    {technicianData.towerComparison.avgRatingVsTowerAvg.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {technicianData.towerComparison.topPerformerInTower && (
                    <InsightBadge type="strength" priority="high" message="Top Performer" />
                  )}
                  {technicianData.towerComparison.performsAboveTowerAverage && (
                    <InsightBadge type="strength" priority="medium" message="Sobre Promedio" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
