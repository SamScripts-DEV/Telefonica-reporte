"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StarRating } from "@/components/ui/star-rating"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Loader2, CheckCircle, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/providers/AuthProvider"
import { AuthUser } from "./matrix-evaluation-form"
interface Question {
  id: string
  text: string
  type: "text" | "select" | "radio" | "rating"
  options?: string[]
  required: boolean
}

interface Evaluation {
  formId: string
  formTitle: string
  isCompleted: boolean
  completedAt: string | null
  responseId: string | null
  questions: Question[]
}

interface Technician {
  id: string
  name: string
  towerId: number
}

interface TechnicianEvaluation {
  technician: Technician
  evaluations: Evaluation[]
}

interface EvaluationData {
  towerId: number
  technicians: Technician[]
  forms: any[]
  matrix: TechnicianEvaluation[]
  completedEvaluations: any[]
  stats: any
}

interface BulkEvaluationFormProps {
  evaluationData: EvaluationData
  onBack: () => void
  user: AuthUser
}

interface Answer {
  questionId: string
  value: string | number
}

interface EvaluationResponse {
  formId: string
  technicianId: string
  answers: Answer[]
}

export function BulkEvaluationForm({ evaluationData, onBack, user }: BulkEvaluationFormProps) {
  const { toast } = useToast()
  const [responses, setResponses] = useState<Record<string, Record<string, string | number>>>({})
  const [loading, setLoading] = useState(false)

  // Get all pending evaluations (not completed)
  const pendingEvaluations = evaluationData.matrix.flatMap((techEval) =>
    techEval.evaluations
      .filter((evaluation) => !evaluation.isCompleted)
      .map((evaluation) => ({
        ...evaluation,
        technicianId: techEval.technician.id,
        technicianName: techEval.technician.name,
      })),
  )

  const handleAnswerChange = (technicianId: string, formId: string, questionId: string, value: string | number) => {
    const key = `${technicianId}-${formId}`
    setResponses((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [questionId]: value,
      },
    }))
  }

  const validateResponses = (): boolean => {
    for (const evaluation of pendingEvaluations) {
      const key = `${evaluation.technicianId}-${evaluation.formId}`
      const evaluationResponses = responses[key] || {}

      for (const question of evaluation.questions) {
        if (question.required && !evaluationResponses[question.id]) {
          toast({
            title: "Campos requeridos",
            description: `Por favor completa la pregunta "${question.text}" para ${evaluation.technicianName}`,
            variant: "destructive",
          })
          return false
        }
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateResponses()) {
      return
    }

    setLoading(true)
    try {
      // Prepare bulk submission data
      const evaluations: EvaluationResponse[] = pendingEvaluations.map((evaluation) => {
        const key = `${evaluation.technicianId}-${evaluation.formId}`
        const evaluationResponses = responses[key] || {}

        return {
          formId: evaluation.formId,
          technicianId: evaluation.technicianId,
          answers: evaluation.questions.map((question) => ({
            questionId: question.id,
            value: evaluationResponses[question.id] || "",
          })),
        }
      })

      const bulkSubmissionData = {
        evaluations,
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log("Bulk submission data:", bulkSubmissionData)

      toast({
        title: "Evaluaciones enviadas",
        description: `Se enviaron ${evaluations.length} evaluaciones exitosamente.`,
        variant: "default",
      })

      // Go back to tower selection
      onBack()
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar las evaluaciones. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error submitting bulk evaluations:", error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = evaluationData.matrix.reduce(
    (count, techEval) => count + techEval.evaluations.filter((evaluation) => evaluation.isCompleted).length,
    0,
  )

  const totalCount = evaluationData.matrix.reduce((count, techEval) => count + techEval.evaluations.length, 0)

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluaciones Torre {evaluationData.towerId}</h1>
            <p className="text-gray-600">
              {pendingEvaluations.length} evaluaciones pendientes • {completedCount}/{totalCount} completadas
            </p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || pendingEvaluations.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Todas ({pendingEvaluations.length})
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{evaluationData.technicians.length}</p>
                <p className="text-sm text-gray-600">Técnicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalCount}</p>
                <p className="text-sm text-gray-600">Total Evaluaciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-sm text-gray-600">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">{pendingEvaluations.length}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingEvaluations.length}</p>
                <p className="text-sm text-gray-600">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations */}
      {pendingEvaluations.length === 0 ? (
        <Card className="shadow-lg border-gray-200 bg-white text-center py-12">
          <CardContent>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              ¡Todas las evaluaciones completadas!
            </CardTitle>
            <CardDescription className="text-gray-600">
              No hay evaluaciones pendientes para esta torre.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingEvaluations.map((evaluation) => {
            const key = `${evaluation.technicianId}-${evaluation.formId}`
            const evaluationResponses = responses[key] || {}

            return (
              <Card key={key} className="shadow-lg border-gray-200 bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">{evaluation.technicianName}</CardTitle>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {evaluation.formTitle}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {evaluation.questions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <Label className="text-gray-700 font-medium">
                        {question.text}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>

                      {question.type === "text" && (
                        <Input
                          value={evaluationResponses[question.id] || ""}
                          onChange={(e) =>
                            handleAnswerChange(evaluation.technicianId, evaluation.formId, question.id, e.target.value)
                          }
                          placeholder="Escribe tu respuesta..."
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      )}

                      {question.type === "radio" && question.options && (
                        <RadioGroup
                          value={evaluationResponses[question.id]?.toString() || ""}
                          onValueChange={(value) =>
                            handleAnswerChange(evaluation.technicianId, evaluation.formId, question.id, value)
                          }
                        >
                          {question.options.map((option) => (
                            <div key={option} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${key}-${question.id}-${option}`} />
                              <Label htmlFor={`${key}-${question.id}-${option}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {question.type === "rating" && (
                        <div className="flex justify-center">
                          <StarRating
                            maxStars={5}
                            value={Number(evaluationResponses[question.id]) || 0}
                            onChange={(rating) =>
                              handleAnswerChange(evaluation.technicianId, evaluation.formId, question.id, rating)
                            }
                            size="md"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
