"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { useFormStore } from "@/stores/form-store"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Edit, Star, MessageSquare, Hash, Building2, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function DetailForm({formId}: {formId: string}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { currentForm, getFormById, isLoading: formLoading, error } = useFormStore()
  const router = useRouter()
  const params = useParams()


  useEffect(() => {
    if (isAuthenticated && user && formId) {
      getFormById(formId)
    }
  }, [isAuthenticated, user, formId, getFormById])

  if (isLoading || formLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null; // El AuthProvider se encarga de redirigir
  }

  if (user.role !== "superadmin") {
    router.push("/dashboard")
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/forms">
            <Button variant="outline">Volver a Formularios</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!currentForm) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Formulario no encontrado</p>
          <Link href="/forms">
            <Button variant="outline">Volver a Formularios</Button>
          </Link>
        </div>
      </div>
    )
  }

  const form = currentForm

  const QUESTION_TYPES = [
    {
      value: "rating",
      label: "Calificación (Estrellas)",
      icon: Star,
      color: "bg-orange-500",
    },
    {
      value: "text",
      label: "Texto Abierto",
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      value: "number",
      label: "Número",
      icon: Hash,
      color: "bg-green-500",
    },
  ]

  const STAR_DESCRIPTIONS = [
    "Muy Insatisfecho - El servicio fue deficiente",
    "Insatisfecho - El servicio no cumplió mis expectativas",
    "Neutral / Regular - El servicio fue aceptable, pero mejorable",
    "Satisfecho - El servicio fue bueno",
    "Muy Satisfecho - El servicio fue excelente",
  ]

  const getQuestionTypeInfo = (type: string) => {
    return QUESTION_TYPES.find((t) => t.value === type) || QUESTION_TYPES[1]
  }

  const renderQuestionPreview = (question: any) => {
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
             
              <Link href={`/forms/${form.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{form.title}</h1>
                <div className="text-blue-100 mt-1 whitespace-pre-line">
                  {form.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Información del formulario */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6" />
                Información del Formulario
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-gray-200">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="font-semibold text-gray-900">{new Date(form.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-gray-200">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-gray-600">Preguntas</p>
                  <p className="font-semibold text-gray-900">{form.questions?.length || 0}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-gray-200">
                  <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <p className="text-sm text-gray-600">Torres</p>
                  <p className="font-semibold text-gray-900">{form.towers?.length || 0}</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Estado y Torres</h3>
                  <div className="flex gap-2">
                    <Badge
                      className={
                        form.status === "active" 
                          ? "bg-green-100 text-green-800 border border-green-200" 
                          : form.status === "draft"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : form.status === "closed"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }
                    >
                      {form.status === "active" && "Activo para responder"}
                      {form.status === "draft" && "En borrador"}
                      {form.status === "closed" && "Cerrado"}
                      {!["active", "draft", "closed"].includes(form.status) && form.status}
                    </Badge>
                    <Badge
                      className={
                        form.isActive 
                          ? "bg-blue-50 text-blue-700 border border-blue-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }
                    >
                      {form.isActive ? "Visible" : "Eliminado"}
                    </Badge>
                    {form.type === "periodic" && (
                      <Badge className="bg-gray-50 text-gray-700 border border-gray-200">
                        Periódico (día {form.startDay}-{form.endDay})
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.towers?.map((tower: any, index: number) => {
                    const colors = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-gray-500"]
                    return (
                      <Badge key={tower.id} className={`${colors[index % colors.length]} text-white border-0 px-3 py-1`}>
                        {tower.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preguntas del formulario */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-blue-700 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-6 w-6" />
                Preguntas del Formulario ({form.questions?.length || 0})
              </CardTitle>
              <CardDescription className="text-blue-100">Vista previa de todas las preguntas</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {form.questions?.map((question: any, index: number) => {
                  const typeInfo = getQuestionTypeInfo(question.questionType) // ✅ CAMBIO: questionType
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
                            {question.isRequired && ( // ✅ CAMBIO: isRequired
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                Obligatoria
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-lg text-gray-900 mb-4">{question.questionText}</p> {/* ✅ CAMBIO: questionText */}
                          {renderQuestionPreview(question)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
