"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useUserStore } from "@/stores/user-store"
import { useTowersStore } from "@/stores/towers-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Users, Building, Wrench } from "lucide-react"
import { CreateSystemUserDto, CreateTechnicianDto } from "@/types/users-types"

const ROLES = [
    { id: 1, name: "superadmin" },
    { id: 2, name: "admin" },
    { id: 3, name: "client" },
    { id: 4, name: "technician" }
]

const ROLE_LABELS: Record<string, string> = {
    superadmin: "Super Administrador",
    admin: "Administrador",
    client: "Cliente",
    technician: "Técnico",
    evaluador: "Evaluador"
    // Agrega más si tienes otros roles
};

export default function UserManagement() {
    const router = useRouter()
    const { user, isAuthenticated, isInitialized, checkAuth } = useAuthStore()
    const { towers, fetchTowers } = useTowersStore()
    const { createUser, createTechnician, isLoading, error, users, getUsers, technicians, getTechnicians } = useUserStore()

    const [form, setForm] = useState<Partial<CreateSystemUserDto & CreateTechnicianDto>>({
        name: "",
        email: "",
        password: "",
        roleId: 3,
        isActive: true,
        towerIds: [],
        groupIds: [],


        towerId: undefined
    })
    const [message, setMessage] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)

    useEffect(() => {
        checkAuth()
        fetchTowers()
        getUsers()
        getTechnicians()
    }, [checkAuth, fetchTowers, getUsers, getTechnicians])

    useEffect(() => {
        if (isInitialized) {
            if (!isAuthenticated) {
                router.push("/login")
            } else if (user?.role !== "superadmin") {
                router.push("/dashboard")
            }
        }
    }, [isInitialized, isAuthenticated, user, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }))
    }

    const handleSelectChange = (name: string, value: string | number) => {
        setForm((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)
        setSuccess(false)

        try {
            if (form.roleId === 4) {
                // Técnico
                const technicianData: CreateTechnicianDto = {
                    name: form.name || "",
                    towerId: Number(form.towerId)

                }
                await createTechnician(technicianData)
                setMessage("Técnico creado correctamente")
                setSuccess(true)
            } else {
                // Usuario del sistema
                const userData: CreateSystemUserDto = {
                    name: form.name || "",
                    email: form.email || "",
                    password: form.password || "",
                    roleId: Number(form.roleId),
                    isActive: !!form.isActive,
                    towerIds: typeof form.towerIds === "string"
                        ? (form.towerIds as string).split(",").map((id) => Number(id.trim())).filter(Boolean)
                        : Array.isArray(form.towerIds) ? form.towerIds as number[] : [],
                    groupIds: typeof form.groupIds === "string"
                        ? (form.groupIds as string).split(",").map((id) => Number(id.trim())).filter(Boolean)
                        : Array.isArray(form.groupIds) ? form.groupIds as number[] : []
                }
                await createUser(userData)
                setMessage("Usuario creado correctamente")
                setSuccess(true)
            }
            setForm({
                name: "",
                email: "",
                password: "",
                roleId: 3,
                isActive: true,
                towerIds: [],
                groupIds: [],
                towerId: undefined
            })
        } catch (err: any) {
            setMessage(err.message || "Error al crear usuario/técnico")
            setSuccess(false)
        }
    }

    if (!isInitialized || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando gestión de usuarios...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Create User/Technician Form */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <Plus className="mr-2 h-5 w-5 text-green-600" />
                                Crear Nuevo Usuario/Técnico
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Añade un nuevo usuario o técnico al sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name" className="text-gray-700">Nombre</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="roleId" className="text-gray-700">Rol</Label>
                                    <Select
                                        name="roleId"
                                        value={String(form.roleId)}
                                        onValueChange={val => handleSelectChange("roleId", Number(val))}
                                    >
                                        <SelectTrigger className="w-full mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                            <SelectValue placeholder="Selecciona un rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map(role => (
                                                <SelectItem key={role.id} value={String(role.id)}>
                                                    {ROLE_LABELS[role.name] || role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Campos para usuarios del sistema */}
                                {form.roleId !== 4 && (
                                    <>
                                        <div>
                                            <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={form.email}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="password" className="text-gray-700">Contraseña (temporal)</Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                value={form.password}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        {/* <div>
                                            <Label htmlFor="towerIds" className="text-gray-700">IDs de Torres (ej: 1,4,7)</Label>
                                            <Input
                                                id="towerIds"
                                                name="towerIds"
                                                type="text"
                                                placeholder="Ej: 1, 2, 5"
                                                value={typeof form.towerIds === "string" ? form.towerIds : ""}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div> */}
                                        <div>
                                            <Label className="text-gray-700">Torres relacionadas</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {towers.map(tower => (
                                                    <label key={tower.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 cursor-pointer transition">
                                                        <input
                                                            type="checkbox"
                                                            value={tower.id}
                                                            checked={Array.isArray(form.towerIds) && form.towerIds.includes(Number(tower.id))}
                                                            onChange={e => {
                                                                const id = Number(e.target.value); // Ensure id is a number
                                                                setForm(f => ({
                                                                    ...f,
                                                                    towerIds: e.target.checked
                                                                        ? [...(Array.isArray(f.towerIds) ? f.towerIds : []), id]
                                                                        : (Array.isArray(f.towerIds) ? f.towerIds.filter(tid => tid !== id) : [])
                                                                }));
                                                            }}
                                                            className="accent-blue-600"
                                                        />
                                                        <span className="text-sm text-gray-700">{tower.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {/* <div>
                                            <Label htmlFor="groupIds" className="text-gray-700">IDs de Grupos (ej: 2,3)</Label>
                                            <Input
                                                id="groupIds"
                                                name="groupIds"
                                                type="text"
                                                placeholder="Ej: 2, 3"
                                                value={typeof form.groupIds === "string" ? form.groupIds : ""}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div> */}
                                    </>
                                )}

                                {/* Campos para técnicos */}
                                {form.roleId === 4 && (
                                    <div>
                                        <Label htmlFor="towerId" className="text-gray-700">Torre</Label>
                                        <Select
                                            name="towerId"
                                            value={form.towerId ? String(form.towerId) : ""}
                                            onValueChange={val => handleSelectChange("towerId", Number(val))}
                                        >
                                            <SelectTrigger className="w-full mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                <SelectValue placeholder="Selecciona una torre" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {towers.map(tower => (
                                                    <SelectItem key={tower.id} value={String(tower.id)}>{tower.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        name="isActive"
                                        checked={!!form.isActive}
                                        onCheckedChange={checked => setForm(f => ({ ...f, isActive: !!checked }))}
                                    />
                                    <Label htmlFor="isActive" className="text-gray-700">Usuario Activo</Label>
                                </div>
                                {message && (
                                    <p className={`text-sm text-center ${success ? "text-green-700" : "text-red-500"}`}>
                                        {message}
                                    </p>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full bg-teal-700 hover:bg-blue-800 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Crear
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* User List */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <Users className="mr-2 h-5 w-5 text-blue-600" />
                                Usuarios Existentes
                            </CardTitle>
                            <CardDescription className="text-gray-600">Lista de todos los usuarios registrados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {users.length === 0 ? (
                                    <p className="text-gray-600 text-center">No hay usuarios registrados.</p>
                                ) : (
                                    users.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-lg">{u.name}</h4>
                                                <p className="text-sm text-gray-600">{u.email}</p>
                                                <p className="text-xs text-gray-500 capitalize mt-1">
                                                    <span className="font-bold">Rol:</span> {ROLE_LABELS[u.role?.name] || u.role?.name} <span className="text-gray-400">(ID: {u.roleId})</span>
                                                </p>
                                                {/* Torres y grupos como badges */}
                                                {u.towers && u.towers.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                                        <Building className="h-3 w-3 mr-1 text-blue-500" />
                                                        {u.towers.map(t => (
                                                            <span key={t.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                                {t.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {u.groups && u.groups.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {u.groups.map(g => (
                                                            <span key={g.id} className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                                                {g.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                                                {u.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Técnicos existentes */}
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-900 flex items-center">
                                <Wrench className="mr-2 h-5 w-5 text-teal-600" />
                                Técnicos Existentes
                            </CardTitle>
                            <CardDescription className="text-gray-600">Lista de todos los técnicos registrados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {technicians.length === 0 ? (
                                    <p className="text-gray-600 text-center">No hay técnicos registrados.</p>
                                ) : (
                                    technicians.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-lg">{t.name}</h4>
                                                {/* <p className="text-sm text-gray-600">{t.position || "Sin puesto"}</p> */}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Torre: <span className="font-bold">{t.tower?.name}</span>
                                                </p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.isActive ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700"}`}>
                                                {t.isActive ? "Activo" : "Activo"}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
