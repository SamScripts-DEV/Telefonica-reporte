"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { StarRating } from "@/components/ui/star-rating"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Loader2, Grid, List, Layers, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFormStore } from "@/stores/form-store"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface User {
  id: string
  name: string
  email: string
  password?: string // Only for mock purposes, should not be stored in real app
  role: string
  roleId?: number // New: Numeric role ID
  isActive?: boolean // New: User active status
  towerIds?: number[] // New: Array of tower IDs
  groupIds?: number[] // New: Array of group IDs (optional)
}

export type AuthUser = User // Added: AuthUser type export

interface Question {
  id: string
  questionText: string
  questionType: "text" | "select" | "radio" | "rating"
  options?: string[]
  isRequired: boolean
  section?: string
}

interface Form {
  id: string
  title: string
  description?: string
  questions: Question[]
}

interface Technician {
  id: string
  name: string
  towerId: number
}

interface EvaluationData {
  towerId: number
  technicians: Technician[]
  forms: Form[]
  matrix: any[]
  completedEvaluations: any[]
  stats: any
}

interface MatrixEvaluationFormProps {
  evaluationData: EvaluationData
  selectedForm: Form
  onBack: (showToast?: boolean) => void
  onSuccess: () => void
  user: AuthUser
  towerName?: string
}

type ViewMode = "complete" | "sections" | "compact"

interface Answer {
  questionId: string
  value: string | number
}

interface EvaluationResponse {
  formId: string
  technicianId: string
  answers: Answer[]
}

export function MatrixEvaluationForm({ evaluationData, selectedForm, onBack, user, towerName, onSuccess }: MatrixEvaluationFormProps) {


  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>("complete")
  const [responses, setResponses] = useState<Record<string, Record<string, string | number>>>({})
  const [loading, setLoading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()
  const { submitBulkEvaluations } = useFormStore()


  // Group questions by section
  const questionsBySection = selectedForm.questions.reduce(
    (acc, question) => {
      const section = question.questionText || "General"
      if (!acc[section]) {
        acc[section] = []
      }
      acc[section].push(question)
      return acc
    },
    {} as Record<string, Question[]>,
  )

  const sections = Object.keys(questionsBySection)

  const handleAnswerChange = (technicianId: string, questionId: string, value: string | number) => {
    setResponses((prev) => ({
      ...prev,
      [technicianId]: {
        ...prev[technicianId],
        [questionId]: value,
      },
    }))
  }

  const validateResponses = (): boolean => {
    for (const technician of evaluationData.technicians) {
      const techResponses = responses[technician.id] || {}

      for (const question of selectedForm.questions) {
        if (question.isRequired && !techResponses[question.id]) {
          toast({
            title: "Campos requeridos",
            description: `Por favor completa "${question.questionText}" para ${technician.name}`,
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
      // Prepara los datos como lo pide el backend
      const evaluations: EvaluationResponse[] = evaluationData.technicians.map((technician) => ({
        formId: selectedForm.id,
        technicianId: technician.id,
        answers: selectedForm.questions.map((question) => ({
          questionId: question.id,
          value: responses[technician.id]?.[question.id] || "",
        })),
      }))

      const bulkSubmissionData = { evaluations }

      // Enviar al backend usando el store
      await submitBulkEvaluations(bulkSubmissionData)

       toast({
         title: "Evaluaciones enviadas",
         description: `Se enviaron ${evaluations.length} evaluaciones exitosamente.`,
         variant: "default",
       })

      onBack(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar las evaluaciones. Inténtalo de nuevo.",
        variant: "destructive",
      })
      console.error("Error submitting matrix evaluations:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const renderQuestionInput = (question: Question, technicianId: string, isCompact = false) => {
    const value = responses[technicianId]?.[question.id] || ""
    const inputId = `${technicianId}-${question.id}`

    switch (question.questionType) {
      case "text":
        return (
          <Input
            id={inputId}
            value={value}
            onChange={(e) => handleAnswerChange(technicianId, question.id, e.target.value)}
            placeholder={isCompact ? "..." : "Respuesta"}
            className="w-full min-w-[120px] text-sm"
          />
        )

      case "radio":
        if (isCompact && question.options) {
          return (
            <Select
              value={value.toString()}
              onValueChange={(val) => handleAnswerChange(technicianId, question.id, val)}
            >
              <SelectTrigger className="w-full min-w-[100px] text-sm">
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
        return (
          <RadioGroup
            value={value.toString()}
            onValueChange={(val) => handleAnswerChange(technicianId, question.id, val)}
            className="flex flex-row gap-4"
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${inputId}-${option}`} />
                <Label htmlFor={`${inputId}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "rating":
        return (
          <div className="flex justify-center">
            <StarRating
              maxStars={5}
              value={Number(value) || 0}
              onChange={(rating: number) => handleAnswerChange(technicianId, question.id, rating)}
              size={isCompact ? "sm" : "md"}
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderCompleteMatrix = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-3 text-left font-semibold text-gray-900 sticky left-0 bg-gray-100 z-10 min-w-[150px]">
              Técnico
            </th>
            {selectedForm.questions.map((question) => (
              <th
                key={question.id}
                className="border border-gray-300 p-3 text-center font-semibold text-gray-900 min-w-[200px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm">{question.questionText}</span>
                  {question.isRequired && <span className="text-red-500 text-xs">*</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evaluationData.technicians.map((technician) => (
            <tr key={technician.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                {technician.name}
              </td>
              {selectedForm.questions.map((question) => (
                <td key={question.id} className="border border-gray-300 p-3 text-center">
                  {renderQuestionInput(question, technician.id)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  const renderSectionMatrix = () => (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <Layers className="mr-2 h-5 w-5 text-purple-600" />
                {section}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection(section)}
                className="text-gray-500 hover:text-gray-700"
              >
                {collapsedSections.has(section) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {!collapsedSections.has(section) && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border border-gray-300 p-3 text-left font-semibold text-gray-900 sticky left-0 bg-purple-50 z-10 min-w-[150px]">
                        Técnico
                      </th>
                      {questionsBySection[section].map((question) => (
                        <th
                          key={question.id}
                          className="border border-gray-300 p-3 text-center font-semibold text-gray-900 min-w-[200px]"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm">{question.questionText}</span>
                            {question.isRequired && <span className="text-red-500 text-xs">*</span>}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationData.technicians.map((technician) => (
                      <tr key={technician.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                          {technician.name}
                        </td>
                        {questionsBySection[section].map((question) => (
                          <td key={question.id} className="border border-gray-300 p-3 text-center">
                            {renderQuestionInput(question, technician.id)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )

  const renderCompactMatrix = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-blue-100">
            <th className="border border-gray-300 p-2 text-left font-semibold text-gray-900 sticky left-0 bg-blue-100 z-10 min-w-[120px]">
              Técnico
            </th>
            {selectedForm.questions.map((question, index) => (
              <th
                key={question.id}
                className="border border-gray-300 p-2 text-center font-semibold text-gray-900 min-w-[120px]"
                title={question.questionText}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs">P{index + 1}</span>
                  {question.isRequired && <span className="text-red-500 text-xs">*</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evaluationData.technicians.map((technician) => (
            <tr key={technician.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 p-2 font-medium text-gray-900 sticky left-0 bg-white z-10">
                <span className="truncate" title={technician.name}>
                  {technician.name.split(" ")[0]}
                </span>
              </td>
              {selectedForm.questions.map((question) => (
                <td key={question.id} className="border border-gray-300 p-2 text-center">
                  {renderQuestionInput(question, technician.id, true)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend for compact view */}
      <Card className="mt-4 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-900">Leyenda de Preguntas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {selectedForm.questions.map((question, index) => (
              <div key={question.id} className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs">
                  P{index + 1}
                </Badge>
                <span className="text-gray-700">{question.questionText}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-full mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            onClick={() => onBack()}
            className="mr-4 p-2 rounded-full border border-gray-200 bg-gray-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm transition-all duration-150"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-blue-500" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedForm.title} - Torre {towerName}
            </h1>


            <p className="text-gray-600">
              {evaluationData.technicians.length} técnicos • {selectedForm.questions.length} preguntas
            </p>
          </div>

        </div>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar Evaluaciones
            </>
          )}
        </Button>
      </div>
      {selectedForm.description && (
        <div className="mb-6 px-2">
          <p
            className="text-gray-700 text-base whitespace-pre-line rounded-lg bg-gray-50 p-4 shadow-sm"
            style={{ whiteSpace: "pre-line" }}
          >
            {selectedForm.description}
          </p>
        </div>
      )}

      {/* View Mode Selector */}
      <Card className="mb-6 border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Seleccionar Vista</CardTitle>
          <CardDescription className="text-gray-600">
            Elige la vista que prefieras para completar las evaluaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="complete" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Matriz Completa
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Por Secciones
              </TabsTrigger>
              <TabsTrigger value="compact" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Vista Compacta
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>

      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>¿Confirmar envío?</DialogTitle>
    </DialogHeader>
    <p className="mb-4">¿Estás seguro de que quieres enviar todas las evaluaciones? No podrás editarlas después.</p>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
        Cancelar
      </Button>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={async () => {
          setShowConfirmDialog(false)
          await handleSubmit()
        }}
      >
        Sí, enviar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



      {/* Matrix Content */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          {viewMode === "complete" && renderCompleteMatrix()}
          {viewMode === "sections" && renderSectionMatrix()}
          {viewMode === "compact" && renderCompactMatrix()}
        </CardContent>
      </Card>
    </div>

    
  )
}
