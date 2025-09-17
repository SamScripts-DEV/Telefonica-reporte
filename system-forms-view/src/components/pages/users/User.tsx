"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/AuthProvider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Users,
    Building,
    Edit,
    Trash2,
    Search,
    UserCheck,
    UserX,
    Shield,
    UserIcon,
    UserPlus,
    Wrench,
    Plus,
    Loader2,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { CreateSystemUserDto, CreateTechnicianDto } from "@/types/users-types"
import { User, Technician, useUserStore } from "@/stores/user-store"
import { useTowersStore } from "@/stores/towers-store"

export default function UserManagementPage() {
    const router = useRouter()
    const { user, isAuthenticated, checkAuth } = useAuth()
    const { toast } = useToast()
    const { towers, fetchTowers } = useTowersStore()
    const {
        users,
        technicians,
        getUsers,
        getTechnicians,
        createTechnician,
        createUser,
        updateUser,
        updateTechnician,
        deleteTechnician,
        deleteUser,
    } = useUserStore()

    // Data states
    const [loading, setLoading] = useState(true)

    // UI states
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
    const [isCreateTechDialogOpen, setIsCreateTechDialogOpen] = useState(false)
    const [creatingUser, setCreatingUser] = useState(false)
    const [creatingTech, setCreatingTech] = useState(false)

    // Form states - usando objetos normales
    const [userForm, setUserForm] = useState<CreateSystemUserDto>({
        name: "",
        email: "",
        password: "",
        roleId: 0,
        isActive: true,
        towerIds: [],
        groupIds: []
    })

    const [techForm, setTechForm] = useState<CreateTechnicianDto>({
        name: "",
        towerId: 0
    })

    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null)
    const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
    const [isEditTechDialogOpen, setIsEditTechDialogOpen] = useState(false)
    const [updatingUser, setUpdatingUser] = useState(false)
    const [updatingTech, setUpdatingTech] = useState(false)
    const [deletingItem, setDeletingItem] = useState<{ id: string; name: string; type: "user" | "technician" } | null>(null)
    const [editUserForm, setEditUserForm] = useState<Partial<CreateSystemUserDto>>({
        name: "",
        email: "",
        password: "",
        roleId: 0,
        isActive: true,
        towerIds: [],
        groupIds: []
    })

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchTowers()
            getUsers()
            getTechnicians()
        }
    }, [isAuthenticated, user, fetchTowers, getUsers, getTechnicians])

    // Reset form cuando se cierra el dialog
    useEffect(() => {
        if (!isCreateUserDialogOpen) {
            setUserForm({
                name: "",
                email: "",
                password: "",
                roleId: 0,
                isActive: true,
                towerIds: [],
                groupIds: []
            })
        }
    }, [isCreateUserDialogOpen])

    useEffect(() => {
        if (!isCreateTechDialogOpen) {
            setTechForm({
                name: "",
                towerId: 0
            })
        }
    }, [isCreateTechDialogOpen])

    // Actualizar cuando se abre el modal de edición
    useEffect(() => {
        if (editingUser && isEditUserDialogOpen) {
            setEditUserForm({
                name: editingUser.name,
                email: editingUser.email,
                password: "", // Siempre vacío para nuevas contraseñas
                roleId: editingUser.roleId,
                isActive: editingUser.isActive,
                towerIds: editingUser.towers.map(t => t.id),
                groupIds: editingUser.groups?.map(g => g.id) || []
            })
        }
    }, [editingUser, isEditUserDialogOpen])

    // Reset form cuando se cierra el modal de edición
    useEffect(() => {
        if (!isEditUserDialogOpen) {
            setEditUserForm({
                name: "",
                email: "",
                password: "",
                roleId: 0,
                isActive: true,
                towerIds: [],
                groupIds: []
            })
        }
    }, [isEditUserDialogOpen])

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreatingUser(true)
        try {

            await createUser(userForm)

            toast({
                title: "Usuario creado",
                description: `Usuario ${userForm.name} creado exitosamente.`,
                variant: "default",
            })

            setIsCreateUserDialogOpen(false)
            getUsers() // Recargar datos
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo crear el usuario.",
                variant: "destructive",
            })
        } finally {
            setCreatingUser(false)
        }
    }

    const handleCreateTechnician = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreatingTech(true)
        try {

            await createTechnician(techForm)

            toast({
                title: "Técnico creado",
                description: `Técnico ${techForm.name} creado exitosamente.`,
                variant: "default",
            })

            setIsCreateTechDialogOpen(false)
            getTechnicians() // Recargar datos
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo crear el técnico.",
                variant: "destructive",
            })
        } finally {
            setCreatingTech(false)
        }
    }

    // Actualizar usuario
    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        setUpdatingUser(true)
        try {


            await useUserStore.getState().updateUser(editingUser.id, editUserForm)
            toast({
                title: "Usuario actualizado",
                description: "Los datos del usuario han sido actualizados.",
                variant: "default",
            })
            setIsEditUserDialogOpen(false)
            getUsers()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el usuario.",
                variant: "destructive",
            })
        } finally {
            setUpdatingUser(false)
        }
    }

    // Borrar usuario (cambiar estado)
    const handleDeleteUser = async (id: string) => {
        try {
            await useUserStore.getState().updateUser(id, { isActive: false })
            toast({
                title: "Usuario desactivado",
                description: "El usuario ha sido desactivado.",
                variant: "default",
            })
            getUsers()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo desactivar el usuario.",
                variant: "destructive",
            })
        }
    }

    // Actualizar técnico
    const handleUpdateTechnician = async (id: string, updatedData: Partial<CreateTechnicianDto>) => {
        try {
            await useUserStore.getState().updateTechnician(id, updatedData)
            toast({
                title: "Técnico actualizado",
                description: "Los datos del técnico han sido actualizados.",
                variant: "default",
            })
            getTechnicians()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar el técnico.",
                variant: "destructive",
            })
        }
    }

    // Borrar técnico (cambiar estado)
    const handleDeleteTechnician = async (id: string) => {
        try {
            await useUserStore.getState().updateTechnician(id, { isActive: false })
            toast({
                title: "Técnico desactivado",
                description: "El técnico ha sido desactivado.",
                variant: "default",
            })
            getTechnicians()
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo desactivar el técnico.",
                variant: "destructive",
            })
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        if (deletingItem.type === "user") {
            await handleDeleteUser(deletingItem.id)
        } else {
            await handleDeleteTechnician(deletingItem.id)
        }
        setDeletingItem(null)
    }

    // Filter users
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === "all" || u.roleId.toString() === roleFilter
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && u.isActive) ||
            (statusFilter === "inactive" && !u.isActive)

        return matchesSearch && matchesRole && matchesStatus
    })

    // Filter technicians
    const filteredTechnicians = technicians.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const getRoleIcon = (roleId: number) => {
        switch (roleId) {
            case 1:
                return <Shield className="h-4 w-4" />
            case 2:
                return <UserIcon className="h-4 w-4" />
            case 3:
                return <Building className="h-4 w-4" />
            default:
                return <UserIcon className="h-4 w-4" />
        }
    }

    const getRoleBadgeColor = (roleId: number) => {
        switch (roleId) {
            case 1:
                return "bg-red-100 text-red-800 border-red-200"
            case 2:
                return "bg-blue-100 text-blue-800 border-blue-200"
            case 3:
                return "bg-green-100 text-green-800 border-green-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const ROLE_LABELS: Record<string, string> = {
        superadmin: "Super Administrador",
        admin: "Administrador",
        client: "Cliente",
        technician: "Técnico",
        evaluador: "Evaluador"
    };

    const ROLES = [
        { id: 1, name: "superadmin" },
        { id: 2, name: "admin" },
        { id: 3, name: "client" },
    ]

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                        <p className="text-gray-600 mt-1">Administra usuarios del sistema y técnicos</p>
                    </div>
                </div>

                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usuarios del Sistema
                        </TabsTrigger>
                        <TabsTrigger value="technicians" className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            Técnicos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-6">
                        <Card className="shadow-lg border-gray-200 bg-white">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-gray-900 flex items-center">
                                            <Users className="mr-2 h-5 w-5 text-blue-600" />
                                            Usuarios del Sistema
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Gestiona usuarios con acceso al sistema
                                        </CardDescription>
                                    </div>
                                    <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Nuevo Usuario
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-gray-900">Crear Usuario del Sistema</DialogTitle>
                                                <DialogDescription className="text-gray-600">
                                                    Añade un nuevo usuario con acceso al sistema.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateUser} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="name">Nombre Completo</Label>
                                                    <Input
                                                        id="name"
                                                        value={userForm.name}
                                                        onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                                                        required
                                                        placeholder="Ej: Juan Pérez"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="email">Correo Electrónico</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={userForm.email}
                                                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                                        required
                                                        placeholder="usuario@empresa.com"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="password">Contraseña Temporal</Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={userForm.password}
                                                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                                        required
                                                        placeholder="Mínimo 6 caracteres"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="roleId">Rol</Label>
                                                    <Select
                                                        value={String(userForm.roleId || "")}
                                                        onValueChange={(value) => setUserForm(prev => ({ ...prev, roleId: Number(value) }))}
                                                    >
                                                        <SelectTrigger>
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
                                                <div>
                                                    <Label className="text-gray-700">Torres relacionadas</Label>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {towers.map(tower => (
                                                            <label key={tower.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 cursor-pointer transition">
                                                                <input
                                                                    type="checkbox"
                                                                    value={tower.id}
                                                                    checked={userForm.towerIds.includes(Number(tower.id))}
                                                                    onChange={e => {
                                                                        const id = Number(e.target.value);
                                                                        setUserForm(prev => ({
                                                                            ...prev,
                                                                            towerIds: e.target.checked
                                                                                ? [...prev.towerIds, id]
                                                                                : prev.towerIds.filter(tid => tid !== id)
                                                                        }));
                                                                    }}
                                                                    className="accent-blue-600"
                                                                />
                                                                <span className="text-sm text-gray-700">{tower.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="isActive"
                                                        checked={userForm.isActive}
                                                        onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, isActive: !!checked }))}
                                                    />
                                                    <Label htmlFor="isActive">Usuario Activo</Label>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="submit" disabled={creatingUser}>
                                                        {creatingUser ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creando...
                                                            </>
                                                        ) : (
                                                            "Crear Usuario"
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Buscar usuarios..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los roles</SelectItem>
                                            <SelectItem value="1">Administrador</SelectItem>
                                            <SelectItem value="2">Cliente</SelectItem>
                                            <SelectItem value="3">Técnico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="active">Activos</SelectItem>
                                            <SelectItem value="inactive">Inactivos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Users List */}
                                <div className="space-y-3">
                                    {filteredUsers.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-medium text-gray-900">{u.name}</h4>
                                                    <Badge className={`text-xs ${getRoleBadgeColor(u.roleId)} flex items-center gap-1`}>
                                                        {getRoleIcon(u.roleId)}
                                                        {u.role.name}
                                                    </Badge>
                                                    {u.isActive ? (
                                                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                                            <UserCheck className="h-3 w-3" />
                                                            Activo
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="text-xs bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                                                            <UserX className="h-3 w-3" />
                                                            Inactivo
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{u.email}</p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {u.towers.length > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <Building className="h-3 w-3" />
                                                            Torres: {u.towers.map((t) => t.name).join(", ")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingUser(u)
                                                        setIsEditUserDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-600 bg-transparent"
                                                    onClick={() => setDeletingItem({ id: u.id, name: u.name, type: "user" })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="technicians" className="space-y-6">
                        <Card className="shadow-lg border-gray-200 bg-white">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="text-gray-900 flex items-center">
                                            <Wrench className="mr-2 h-5 w-5 text-green-600" />
                                            Técnicos
                                        </CardTitle>
                                        <CardDescription className="text-gray-600">
                                            Gestiona técnicos asignados a torres
                                        </CardDescription>
                                    </div>
                                    <Dialog open={isCreateTechDialogOpen} onOpenChange={setIsCreateTechDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="bg-green-700 hover:bg-green-800 text-white">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Nuevo Técnico
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-white max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-gray-900">Crear Técnico</DialogTitle>
                                                <DialogDescription className="text-gray-600">
                                                    Añade un nuevo técnico y asígnalo a una torre.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleCreateTechnician} className="space-y-4">
                                                <div>
                                                    <Label htmlFor="tech-name">Nombre Completo</Label>
                                                    <Input
                                                        id="tech-name"
                                                        value={techForm.name}
                                                        onChange={(e) => setTechForm(prev => ({ ...prev, name: e.target.value }))}
                                                        required
                                                        placeholder="Ej: María López"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="towerId">Torre Asignada</Label>
                                                    <Select
                                                        value={String(techForm.towerId || "")}
                                                        onValueChange={(value) => setTechForm(prev => ({ ...prev, towerId: Number(value) }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona una torre" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {towers.map(tower => (
                                                                <SelectItem key={tower.id} value={String(tower.id)}>{tower.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsCreateTechDialogOpen(false)}>
                                                        Cancelar
                                                    </Button>
                                                    <Button type="submit" disabled={creatingTech}>
                                                        {creatingTech ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creando...
                                                            </>
                                                        ) : (
                                                            "Crear Técnico"
                                                        )}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Search */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Buscar técnicos..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Technicians List */}
                                <div className="space-y-3">
                                    {filteredTechnicians.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-medium text-gray-900">{t.name}</h4>
                                                    <Badge className="text-xs bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                                        <Building className="h-3 w-3" />
                                                        {t.tower.name}
                                                    </Badge>
                                                    {t.position && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {t.position}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">Torre ID: {t.towerId}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingTechnician(t)
                                                        setIsEditTechDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-600 bg-transparent"
                                                    onClick={() => setDeletingItem({ id: t.id, name: t.name, type: "technician" })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Resto de los modals... */}
            {/* Modal de Edición de Usuario */}
            <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Editar Usuario</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Modifica la información del usuario seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <Label htmlFor="edit-name">Nombre Completo</Label>
                                <Input
                                    id="edit-name"
                                    value={editUserForm.name || ""}
                                    onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-email">Correo Electrónico</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editUserForm.email || ""}
                                    onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                    placeholder="usuario@empresa.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={editUserForm.password || ""}
                                    onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Dejar vacío para mantener actual"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-roleId">Rol</Label>
                                <Select
                                    value={String(editUserForm.roleId || "")}
                                    onValueChange={(value) => setEditUserForm(prev => ({ ...prev, roleId: Number(value) }))}
                                >
                                    <SelectTrigger>
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
                            <div>
                                <Label className="text-gray-700">Torres relacionadas</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {towers.map(tower => (
                                        <label key={tower.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                value={tower.id}
                                                checked={editUserForm.towerIds?.includes(Number(tower.id)) || false}
                                                onChange={e => {
                                                    const id = Number(e.target.value);
                                                    setEditUserForm(prev => ({
                                                        ...prev,
                                                        towerIds: e.target.checked
                                                            ? [...(prev.towerIds || []), id]
                                                            : (prev.towerIds || []).filter(tid => tid !== id)
                                                    }));
                                                }}
                                                className="accent-blue-600"
                                            />
                                            <span className="text-sm text-gray-700">{tower.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="edit-isActive"
                                    checked={editUserForm.isActive || false}
                                    onCheckedChange={(checked) => setEditUserForm(prev => ({ ...prev, isActive: !!checked }))}
                                />
                                <Label htmlFor="edit-isActive">Usuario Activo</Label>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={updatingUser}>
                                    {updatingUser ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        "Actualizar Usuario"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Edición de Técnico */}
            <Dialog open={isEditTechDialogOpen} onOpenChange={setIsEditTechDialogOpen}>
                <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Editar Técnico</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Modifica la información del técnico seleccionado.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTechnician && (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                await handleUpdateTechnician(editingTechnician.id, {
                                    name: formData.get("name") as string,
                                    towerId: Number(formData.get("towerId")),
                                })
                                setIsEditTechDialogOpen(false)
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <Label htmlFor="edit-tech-name">Nombre Completo</Label>
                                <Input
                                    id="edit-tech-name"
                                    name="name"
                                    required
                                    defaultValue={editingTechnician.name}
                                    placeholder="Ej: María López"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-towerId">Torre Asignada</Label>
                                <Select name="towerId" defaultValue={editingTechnician.towerId.toString()} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {towers.map(tower => (
                                            <SelectItem key={tower.id} value={String(tower.id)}>{tower.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditTechDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={updatingTech}>
                                    {updatingTech ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        "Actualizar Técnico"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmación de Eliminación */}
            <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
                <DialogContent className="bg-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 text-red-600">
                            ¿Eliminar {deletingItem?.type === "user" ? "Usuario" : "Técnico"}?
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Esta acción no se puede deshacer. Se eliminará permanentemente el usuario &quot;{deletingItem?.name}&quot; y
                            todos sus datos asociados.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeletingItem(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Sí, Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
