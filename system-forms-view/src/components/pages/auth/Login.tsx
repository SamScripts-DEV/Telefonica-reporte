"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Loader2, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const { login, isLoading } = useAuth()
  const router = useRouter()


 
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {

      const result = await login(email, password)
      console.log("Login exitoso:", result);

      router.push("/dashboard")
    } catch (err) {
      setError("Credenciales inválidas. Intenta de nuevo.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-700 p-3 rounded-full shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">FormManager</h1>
          <p className="text-gray-600 mt-2">Sistema de Gestión de Formularios</p>
        </div>
        <Card className="shadow-xl border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-900">Iniciar Sesión</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre.apellido@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-9 text-gray-500 hover:text-blue-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>


              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-base bg-blue-700 hover:bg-blue-800 shadow-lg text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
