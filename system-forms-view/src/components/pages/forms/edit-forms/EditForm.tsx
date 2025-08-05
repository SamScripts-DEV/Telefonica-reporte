"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useFormStore, type FormQuestion } from "@/stores/form-store"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { Plus, Trash2, Save, ArrowLeft, Star, MessageSquare, Hash, Building2, Edit } from "lucide-react"
import Link from "next/link"

const TOWERS = ["Torre A", "Torre B", "Torre C", "Torre D"]

const QUESTION_TYPES = [
  {
    value: "rating",
    label: "Calificación (Estrellas)",
    icon: Star,
    color: "bg-orange-500",
    description: "Permite calificar del 1 al 5 con estrellas",
  },
  {
    value: "text",
    label: "Texto Abierto",
    icon: MessageSquare,
    color: "bg-blue-500",
    description: "Respuesta de texto libre",
  },
  {
    value: "number",
    label: "Número",
    icon: Hash,
    color: "bg-green-500",
    description: "Respuesta numérica",
  },
]

const STAR_DESCRIPTIONS = [
  "Muy Insatisfecho - El servicio fue deficiente",
  "Insatisfecho - El servicio no cumplió mis expectativas",
  "Neutral / Regular - El servicio fue aceptable, pero mejorable",
  "Satisfecho - El servicio fue bueno",
  "Muy Satisfecho - El servicio fue excelente",
]

export default function EditForm({formId}: {formId: string}) {
  const { user, isAuthenticated, checkAuth, isInitialized } = useAuthStore()
  const { getFormById, updateForm } = useFormStore()
  const router = useRouter()
  const params = useParams()
  

  const existingForm = getFormById(formId)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetTowers: [] as string[],
    isActive: true,
  })

  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "text" as "rating" | "text" | "number",
    required: true,
    options: {},
  })

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push("/login")
      } else if (user && user.role !== "superadmin") {
        router.push("/dashboard")
      }
    }
  }, [isInitialized, isAuthenticated, user, router])

  // useEffect(() => {
  //   if (existingForm) {
  //     setFormData({
  //       title: existingForm.title,
  //       description: existingForm.description,
  //       targetTowers: existingForm.targetTowers,
  //       isActive: existingForm.isActive,
  //     })
  //     setQuestions(existingForm.questions)
  //   }
  // }, [existingForm])

  if (!isInitialized || !user || !existingForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  const handleTowerToggle = (tower: string) => {
    setFormData((prev) => ({
      ...prev,
      targetTowers: prev.targetTowers.includes(tower)
        ? prev.targetTowers.filter((t) => t !== tower)
        : [...prev.targetTowers, tower],
    }))
  }

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) return

    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      text: currentQuestion.text,
      type: currentQuestion.type,
      required: currentQuestion.required,
      options:
        currentQuestion.type === "rating"
          ? { maxStars: 5, starDescriptions: STAR_DESCRIPTIONS }
          : currentQuestion.type === "text"
            ? { placeholder: "Escribe tu respuesta aquí..." }
            : {},
    }

    setQuestions((prev) => [...prev, newQuestion])
    setCurrentQuestion({
      text: "",
      type: "text",
      required: true,
      options: {},
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Por favor completa el título y descripción")
      return
    }

    if (formData.targetTowers.length === 0) {
      alert("Selecciona al menos una torre")
      return
    }

    if (questions.length === 0) {
      alert("Agrega al menos una pregunta")
      return
    }

    updateForm(formId, {
      ...formData,
      questions,
    })

    router.push("/forms")
  }

  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="flex justify-center p-4 bg-orange-50 rounded-lg">
            <StarRating maxStars={5} readonly starDescriptions={STAR_DESCRIPTIONS} />
          </div>
        )
      case "number":
        return (
          <div className="p-4 bg-green-50 rounded-lg">
            <Input type="number" placeholder="0" disabled className="bg-white/50 border-gray-200" />
          </div>
        )
      case "text":
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <Textarea placeholder="Respuesta..." disabled className="bg-white/50 border-gray-200" />
          </div>
        )
      default:
        return null
    }
  }

  const getQuestionTypeInfo = (type: string) => {
    return QUESTION_TYPES.find((t) => t.value === type) || QUESTION_TYPES[1]
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header con gradiente coherente */}
        <div className="relative mb-8 p-6 rounded-2xl bg-blue-700 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/forms">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Edit className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Editar Formulario</h1>
                <p className="text-blue-100 mt-1">Modifica tu formulario de evaluación</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica con gradiente */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6" />
                Información Básica
              </CardTitle>
              <CardDescription className="text-blue-100">
                Modifica los detalles principales del formulario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <Label htmlFor="title" className="text-lg font-medium text-gray-700">
                  Título del Formulario
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Evaluación de Servicio Técnico"
                  required
                  className="h-12 text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-lg font-medium text-gray-700">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este formulario..."
                  required
                  className="min-h-[100px] text-lg border-2 border-gray-300 focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-medium text-gray-700">Torres Objetivo</Label>
                <div className="grid grid-cols-2 gap-4">
                  {TOWERS.map((tower, index) => {
                    const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-gray-500"]
                    return (
                      <div
                        key={tower}
                        className={`p-4 rounded-xl ${colors[index]} text-white shadow-lg hover:shadow-xl transition-all cursor-pointer ${formData.targetTowers.includes(tower) ? "ring-4 ring-white ring-opacity-50" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={tower}
                            checked={formData.targetTowers.includes(tower)}
                            onCheckedChange={() => handleTowerToggle(tower)}
                            className="border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                          />
                          <Label htmlFor={tower} className="font-medium cursor-pointer">
                            {tower}
                          </Label>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {formData.targetTowers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.targetTowers.map((tower) => (
                      <Badge key={tower} className="bg-blue-500 text-white px-3 py-1">
                        {tower}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: !!checked }))}
                  className="data-[state=checked]:bg-blue-500 border-gray-300"
                />
                <Label htmlFor="isActive" className="text-lg font-medium text-gray-700 cursor-pointer">
                  Formulario activo
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Agregar preguntas con diseño mejorado */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-green-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-6 w-6" />
                Agregar Nueva Pregunta
              </CardTitle>
              <CardDescription className="text-green-100">Agrega más preguntas a tu formulario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="questionText" className="text-lg font-medium text-gray-700">
                  Texto de la Pregunta
                </Label>
                <Input
                  id="questionText"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="¿Cómo calificarías...?"
                  className="h-12 text-lg border-2 border-gray-300 focus:border-green-500 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-medium text-gray-700">Tipo de Pregunta</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {QUESTION_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = currentQuestion.type === type.value
                    return (
                      <div
                        key={type.value}
                        onClick={() => setCurrentQuestion((prev) => ({ ...prev, type: type.value as any }))}
                        className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                          isSelected
                            ? `${type.color} text-white border-transparent shadow-lg scale-105`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div className="text-center space-y-2">
                          <div
                            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                              isSelected ? "bg-white/20" : type.color
                            }`}
                          >
                            <Icon className={`h-6 w-6 ${isSelected ? "text-white" : "text-white"}`} />
                          </div>
                          <h3 className={`font-medium ${isSelected ? "text-white" : "text-gray-900"}`}>
                            {type.label}
                          </h3>
                          <p className={`text-sm ${isSelected ? "text-white/80" : "text-gray-600"}`}>
                            {type.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Checkbox
                  id="required"
                  checked={currentQuestion.required}
                  onCheckedChange={(checked) => setCurrentQuestion((prev) => ({ ...prev, required: !!checked }))}
                  className="data-[state=checked]:bg-green-500 border-gray-300"
                />
                <Label htmlFor="required" className="text-lg font-medium text-gray-700 cursor-pointer">
                  Pregunta obligatoria
                </Label>
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                className="w-full h-14 text-lg bg-green-700 hover:bg-green-800 shadow-lg hover:shadow-xl transition-all text-white"
              >
                <Plus className="mr-2 h-5 w-5" />
                Agregar Pregunta
              </Button>
            </CardContent>
          </Card>

          {/* Lista de preguntas con mejor diseño */}
          {questions.length > 0 && (
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader className="bg-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageSquare className="h-6 w-6" />
                  Preguntas del Formulario ({questions.length})
                </CardTitle>
                <CardDescription className="text-blue-100">Vista previa de las preguntas</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const typeInfo = getQuestionTypeInfo(question.type)
                    const TypeIcon = typeInfo.icon
                    return (
                      <div
                        key={question.id}
                        className="border-2 border-gray-200 rounded-xl p-6 bg-white shadow-md hover:shadow-lg transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-full ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                Pregunta {index + 1}
                              </span>
                              <Badge className={`${typeInfo.color} text-white border-0`}>{typeInfo.label}</Badge>
                              {question.required && (
                                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                  Obligatoria
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-lg text-gray-900 mb-4">{question.text}</p>
                            {renderQuestionPreview(question)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción con gradientes */}
          <div className="flex justify-end gap-4 pt-6">
            <Link href="/forms">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8 text-lg bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              className="h-12 px-8 text-lg bg-blue-700 hover:bg-blue-800 shadow-lg hover:shadow-xl transition-all text-white"
            >
              <Save className="mr-2 h-5 w-5" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
