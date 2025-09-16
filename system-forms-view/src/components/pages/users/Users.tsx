// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import { useAuth } from "@/providers/AuthProvider"
// import { User, UserRole, useUserStore } from "@/stores/user-store"
// import { useTowersStore } from "@/stores/towers-store"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Plus, Loader2, Users, Building, Wrench, Search, Filter, UserCheck, UserX, Shield, UserIcon, Edit, Trash2 } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { CreateSystemUserDto, CreateTechnicianDto } from "@/types/users-types"
// import {
//     AlertDialog,
//     AlertDialogTrigger,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,


// } from "@/components/ui/alert-dialog"
// import {
//     Dialog,
//     DialogTrigger,
//     DialogContent,
//     DialogDescription,
//     DialogFooter,
//     DialogHeader,
//     DialogTitle

// } from "@/components/ui/dialog"

// import { useToast } from "@/hooks/use-toast"


// const ROLES = [
//     { id: 1, name: "superadmin" },
//     { id: 2, name: "admin" },
//     { id: 3, name: "client" },
//     { id: 4, name: "technician" }
// ]

// const ROLE_LABELS: Record<string, string> = {
//     superadmin: "Super Administrador",
//     admin: "Administrador",
//     client: "Cliente",
//     technician: "Técnico",
//     evaluador: "Evaluador"
//     // Agrega más si tienes otros roles
// };

// export default function UserManagement() {
//     const router = useRouter()
//     const { toast } = useToast()
//     const { user, isAuthenticated, isLoading } = useAuth()
//     const { towers, fetchTowers } = useTowersStore()
//     const { createUser, createTechnician, isLoading: userLoading, error, users, getUsers, technicians, getTechnicians } = useUserStore()

//     // // Form states
//     // const [createState, createAction, isCreating] = useActionState<FormState, FormData>(createUserAction, {
//     //     success: false,
//     //     message: "",
//     // })
//     // const [updateState, updateAction, isUpdating] = useActionState<FormState, FormData>(updateUserAction, {
//     //     success: false,
//     //     message: "",
//     // })


//     const [form, setForm] = useState<Partial<CreateSystemUserDto & CreateTechnicianDto>>({
//         name: "",
//         email: "",
//         password: "",
//         roleId: 3,
//         isActive: true,
//         towerIds: [],
//         groupIds: [],


//         towerId: undefined
//     })
//     const [message, setMessage] = useState<string | null>(null)
//     const [success, setSuccess] = useState<boolean>(false)
//     const [searchTerm, setSearchTerm] = useState("")
//     const [roleFilter, setRoleFilter] = useState("all")
//     const [statusFilter, setStatusFilter] = useState("all")
//     const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
//     const [editingUser, setEditingUser] = useState<User | null>(null)



//     useEffect(() => {
//         if (isAuthenticated && user) {
//             fetchTowers()
//             getUsers()
//             getTechnicians()
//         }
//     }, [isAuthenticated, user, fetchTowers, getUsers, getTechnicians])

//     // useEffect(() => {
//     //     if (createState.success) {
//     //         toast({
//     //             title: "Usuario creado",
//     //             description: createState.message,
//     //             variant: "success",
//     //         })
//     //         setIsCreateDialogOpen(false)
//     //         // Reset form would be handled by closing the dialog
//     //     } else if (createState.message && !createState.success) {
//     //         toast({
//     //             title: "Error al crear usuario",
//     //             description: createState.message,
//     //             variant: "destructive",
//     //         })
//     //     }
//     // }, [createState, toast])

//     // useEffect(() => {
//     //     if (updateState.success) {
//     //         toast({
//     //             title: "Usuario actualizado",
//     //             description: updateState.message,
//     //             variant: "success",
//     //         })
//     //         setIsEditDialogOpen(false)
//     //         setEditingUser(null)
//     //     } else if (updateState.message && !updateState.success) {
//     //         toast({
//     //             title: "Error al actualizar usuario",
//     //             description: updateState.message,
//     //             variant: "destructive",
//     //         })
//     //     }
//     // }, [updateState, toast])


//     //Filtered user
//     const filteredUsers = users.filter((u) => {
//         const matchesSearch =
//             u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             u.email.toLowerCase().includes(searchTerm.toLowerCase())
//         const matchesRole = roleFilter === "all" || u.role.name === roleFilter
//         const matchesStatus =
//             statusFilter === "all" ||
//             (statusFilter === "active" && u.isActive) ||
//             (statusFilter === "inactive" && !u.isActive)

//         return matchesSearch && matchesRole && matchesStatus
//     })

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value, type, checked } = e.target
//         setForm((prev) => ({
//             ...prev,
//             [name]: type === "checkbox" ? checked : value
//         }))
//     }

//     const handleSelectChange = (name: string, value: string | number) => {
//         setForm((prev) => ({
//             ...prev,
//             [name]: value
//         }))
//     }

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault()
//         setMessage(null)
//         setSuccess(false)

//         try {
//             if (form.roleId === 4) {
//                 // Técnico
//                 const technicianData: CreateTechnicianDto = {
//                     name: form.name || "",
//                     towerId: Number(form.towerId)

//                 }
//                 await createTechnician(technicianData)
//                 setMessage("Técnico creado correctamente")
//                 setSuccess(true)
//             } else {
//                 // Usuario del sistema
//                 const userData: CreateSystemUserDto = {
//                     name: form.name || "",
//                     email: form.email || "",
//                     password: form.password || "",
//                     roleId: Number(form.roleId),
//                     isActive: !!form.isActive,
//                     towerIds: typeof form.towerIds === "string"
//                         ? (form.towerIds as string).split(",").map((id) => Number(id.trim())).filter(Boolean)
//                         : Array.isArray(form.towerIds) ? form.towerIds as number[] : [],
//                     groupIds: typeof form.groupIds === "string"
//                         ? (form.groupIds as string).split(",").map((id) => Number(id.trim())).filter(Boolean)
//                         : Array.isArray(form.groupIds) ? form.groupIds as number[] : []
//                 }
//                 await createUser(userData)
//                 setMessage("Usuario creado correctamente")
//                 setSuccess(true)
//             }
//             setForm({
//                 name: "",
//                 email: "",
//                 password: "",
//                 roleId: 3,
//                 isActive: true,
//                 towerIds: [],
//                 groupIds: [],
//                 towerId: undefined
//             })
//         } catch (err: any) {
//             setMessage(err.message || "Error al crear usuario/técnico")
//             setSuccess(false)
//         }
//     }

//     const handleEditUser = (userToEdit: User) => {
//         setEditingUser(userToEdit)
//         setIsEditDialogOpen(true)
//     }

//     if (isLoading || userLoading) {
//         return (
//             <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//                     <p className="text-gray-600">Cargando gestión de usuarios...</p>
//                 </div>
//             </div>
//         )
//     }

//     if (!isAuthenticated || !user) {
//         return null; // El AuthProvider se encarga de redirigir
//     }

//     if (user.role !== "superadmin") {
//         router.push("/dashboard")
//         return null
//     }

//     const getRoleIcon = (role: string) => {
//         switch (role) {
//             case "superadmin":
//                 return <Shield className="h-4 w-4 text-red-700" />
//             case "admin":
//                 return <Shield className="h-4 w-4 text-red-600" />
//             case "client":
//                 return <UserIcon className="h-4 w-4 text-blue-600" />
//             case "technician":
//                 return <Building className="h-4 w-4 text-green-600" />
//             default:
//                 return <UserIcon className="h-4 w-4 text-gray-600" />
//         }
//     }

//     const getRoleBadgeColor = (role: string) => {
//         switch (role) {
//             case "superadmin":
//                 return "bg-red-200 text-red-800 border-red-300"
//             case "admin":
//                 return "bg-red-100 text-red-800 border-red-200"
//             case "client":
//                 return "bg-blue-100 text-blue-800 border-blue-200"
//             case "technician":
//                 return "bg-green-100 text-green-800 border-green-200"
//             default:
//                 return "bg-gray-100 text-gray-800 border-gray-200"
//         }
//     }






//     return (
//         <div className="min-h-screen bg-gray-100">
//             <div className="max-w-7xl mx-auto p-6">
//                 <h1 className="text-3xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* Create User/Technician Form */}
//                     <Card className="shadow-lg border-gray-200 bg-white">
//                         <CardHeader>
//                             <CardTitle className="text-gray-900 flex items-center">
//                                 <Plus className="mr-2 h-5 w-5 text-green-600" />
//                                 Crear Nuevo Usuario/Técnico
//                             </CardTitle>
//                             <CardDescription className="text-gray-600">
//                                 Añade un nuevo usuario o técnico al sistema.
//                             </CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <Label htmlFor="name" className="text-gray-700">Nombre</Label>
//                                     <Input
//                                         id="name"
//                                         name="name"
//                                         type="text"
//                                         required
//                                         value={form.name}
//                                         onChange={handleChange}
//                                         className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                     />
//                                 </div>
//                                 <div>
//                                     <Label htmlFor="roleId" className="text-gray-700">Rol</Label>
//                                     <Select
//                                         name="roleId"
//                                         value={String(form.roleId)}
//                                         onValueChange={val => handleSelectChange("roleId", Number(val))}
//                                     >
//                                         <SelectTrigger className="w-full mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
//                                             <SelectValue placeholder="Selecciona un rol" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {ROLES.map(role => (
//                                                 <SelectItem key={role.id} value={String(role.id)}>
//                                                     {ROLE_LABELS[role.name] || role.name}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>

//                                 {/* Campos para usuarios del sistema */}
//                                 {form.roleId !== 4 && (
//                                     <>
//                                         <div>
//                                             <Label htmlFor="email" className="text-gray-700">Correo Electrónico</Label>
//                                             <Input
//                                                 id="email"
//                                                 name="email"
//                                                 type="email"
//                                                 required
//                                                 value={form.email}
//                                                 onChange={handleChange}
//                                                 className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                             />
//                                         </div>
//                                         <div>
//                                             <Label htmlFor="password" className="text-gray-700">Contraseña (temporal)</Label>
//                                             <Input
//                                                 id="password"
//                                                 name="password"
//                                                 type="password"
//                                                 required
//                                                 value={form.password}
//                                                 onChange={handleChange}
//                                                 className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                             />
//                                         </div>
//                                         {/* <div>
//                                             <Label htmlFor="towerIds" className="text-gray-700">IDs de Torres (ej: 1,4,7)</Label>
//                                             <Input
//                                                 id="towerIds"
//                                                 name="towerIds"
//                                                 type="text"
//                                                 placeholder="Ej: 1, 2, 5"
//                                                 value={typeof form.towerIds === "string" ? form.towerIds : ""}
//                                                 onChange={handleChange}
//                                                 className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                             />
//                                         </div> */}
//                                         <div>
//                                             <Label className="text-gray-700">Torres relacionadas</Label>
//                                             <div className="flex flex-wrap gap-2 mt-2">
//                                                 {towers.map(tower => (
//                                                     <label key={tower.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg shadow-sm hover:bg-blue-50 cursor-pointer transition">
//                                                         <input
//                                                             type="checkbox"
//                                                             value={tower.id}
//                                                             checked={Array.isArray(form.towerIds) && form.towerIds.includes(Number(tower.id))}
//                                                             onChange={e => {
//                                                                 const id = Number(e.target.value); // Ensure id is a number
//                                                                 setForm(f => ({
//                                                                     ...f,
//                                                                     towerIds: e.target.checked
//                                                                         ? [...(Array.isArray(f.towerIds) ? f.towerIds : []), id]
//                                                                         : (Array.isArray(f.towerIds) ? f.towerIds.filter(tid => tid !== id) : [])
//                                                                 }));
//                                                             }}
//                                                             className="accent-blue-600"
//                                                         />
//                                                         <span className="text-sm text-gray-700">{tower.name}</span>
//                                                     </label>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                         {/* <div>
//                                             <Label htmlFor="groupIds" className="text-gray-700">IDs de Grupos (ej: 2,3)</Label>
//                                             <Input
//                                                 id="groupIds"
//                                                 name="groupIds"
//                                                 type="text"
//                                                 placeholder="Ej: 2, 3"
//                                                 value={typeof form.groupIds === "string" ? form.groupIds : ""}
//                                                 onChange={handleChange}
//                                                 className="mt-1 block w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
//                                             />
//                                         </div> */}
//                                     </>
//                                 )}

//                                 {/* Campos para técnicos */}
//                                 {form.roleId === 4 && (
//                                     <div>
//                                         <Label htmlFor="towerId" className="text-gray-700">Torre</Label>
//                                         <Select
//                                             name="towerId"
//                                             value={form.towerId ? String(form.towerId) : ""}
//                                             onValueChange={val => handleSelectChange("towerId", Number(val))}
//                                         >
//                                             <SelectTrigger className="w-full mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
//                                                 <SelectValue placeholder="Selecciona una torre" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 {towers.map(tower => (
//                                                     <SelectItem key={tower.id} value={String(tower.id)}>{tower.name}</SelectItem>
//                                                 ))}
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
//                                 )}

//                                 <div className="flex items-center space-x-2">
//                                     <Checkbox
//                                         id="isActive"
//                                         name="isActive"
//                                         checked={!!form.isActive}
//                                         onCheckedChange={checked => setForm(f => ({ ...f, isActive: !!checked }))}
//                                     />
//                                     <Label htmlFor="isActive" className="text-gray-700">Usuario Activo</Label>
//                                 </div>
//                                 {message && (
//                                     <p className={`text-sm text-center ${success ? "text-green-700" : "text-red-500"}`}>
//                                         {message}
//                                     </p>
//                                 )}
//                                 <Button
//                                     type="submit"
//                                     className="w-full bg-teal-700 hover:bg-blue-800 text-white"
//                                     disabled={userLoading}
//                                 >
//                                     {userLoading ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Creando...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Plus className="mr-2 h-4 w-4" />
//                                             Crear
//                                         </>
//                                     )}
//                                 </Button>
//                             </form>
//                         </CardContent>
//                     </Card>

//                     {/* User List */}
//                     <Card className="shadow-lg border-gray-200 bg-white">
//                         <CardHeader>
//                             <CardTitle className="text-gray-900 flex items-center">
//                                 <Users className="mr-2 h-5 w-5 text-blue-600" />
//                                 Usuarios Existentes
//                             </CardTitle>
//                             <CardDescription className="text-gray-600">Lista de todos los usuarios registrados.</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
//                                 {users.length === 0 ? (
//                                     <p className="text-gray-600 text-center">No hay usuarios registrados.</p>
//                                 ) : (
//                                     users.map((u) => (
//                                         <div
//                                             key={u.id}
//                                             className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
//                                         >
//                                             <div>
//                                                 <h4 className="font-semibold text-gray-900 text-lg">{u.name}</h4>
//                                                 <p className="text-sm text-gray-600">{u.email}</p>
//                                                 <p className="text-xs text-gray-500 capitalize mt-1">
//                                                     <span className="font-bold">Rol:</span> {ROLE_LABELS[u.role?.name] || u.role?.name} <span className="text-gray-400">(ID: {u.roleId})</span>
//                                                 </p>
//                                                 {/* Torres y grupos como badges */}
//                                                 {u.towers && u.towers.length > 0 && (
//                                                     <div className="flex flex-wrap items-center gap-1 mt-1">
//                                                         <Building className="h-3 w-3 mr-1 text-blue-500" />
//                                                         {u.towers.map(t => (
//                                                             <span key={t.id} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
//                                                                 {t.name}
//                                                             </span>
//                                                         ))}
//                                                     </div>
//                                                 )}
//                                                 c
//                                             </div>
//                                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
//                                                 {u.isActive ? "Activo" : "Inactivo"}
//                                             </span>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Técnicos existentes */}
//                     <Card className="shadow-lg border-gray-200 bg-white">
//                         <CardHeader>
//                             <CardTitle className="text-gray-900 flex items-center">
//                                 <Wrench className="mr-2 h-5 w-5 text-teal-600" />
//                                 Técnicos Existentes
//                             </CardTitle>
//                             <CardDescription className="text-gray-600">Lista de todos los técnicos registrados.</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
//                                 {technicians.length === 0 ? (
//                                     <p className="text-gray-600 text-center">No hay técnicos registrados.</p>
//                                 ) : (
//                                     technicians.map((t) => (
//                                         <div
//                                             key={t.id}
//                                             className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
//                                         >
//                                             <div>
//                                                 <h4 className="font-semibold text-gray-900 text-lg">{t.name}</h4>
//                                                 {/* <p className="text-sm text-gray-600">{t.position || "Sin puesto"}</p> */}
//                                                 <p className="text-xs text-gray-500 mt-1">
//                                                     Torre: <span className="font-bold">{t.tower?.name}</span>
//                                                 </p>
//                                             </div>
//                                             <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.isActive ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700"}`}>
//                                                 {t.isActive ? "Activo" : "Activo"}
//                                             </span>
//                                         </div>
//                                     ))
//                                 )}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>

//             <Card className="shadow-lg border-app-gray-200 bg-white">
//                 <CardHeader>
//                     <CardTitle className="text-app-gray-900 flex items-center">
//                         <Users className="mr-2 h-5 w-5 text-app-blue-600" />
//                         Usuarios del Sistema
//                     </CardTitle>
//                     <CardDescription className="text-app-gray-600">
//                         Lista completa de usuarios registrados con opciones de gestión avanzada.
//                     </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                     {/* Filters */}
//                     <div className="flex flex-col sm:flex-row gap-4 mb-6">
//                         <div className="flex-1">
//                             <div className="relative">
//                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-gray-400 h-4 w-4" />
//                                 <Input
//                                     placeholder="Buscar por nombre o email..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="pl-10 border-app-gray-300 focus:border-app-blue-500 focus:ring-app-blue-500"
//                                 />
//                             </div>
//                         </div>
//                         <div className="flex gap-2">
//                             <Select value={roleFilter} onValueChange={setRoleFilter}>
//                                 <SelectTrigger className="w-[140px] border-app-gray-300">
//                                     <Filter className="h-4 w-4 mr-2" />
//                                     <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="all">Todos los roles</SelectItem>
//                                     <SelectItem value="admin">Administrador</SelectItem>
//                                     <SelectItem value="client">Cliente</SelectItem>
//                                     <SelectItem value="technician">Técnico</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                             <Select value={statusFilter} onValueChange={setStatusFilter}>
//                                 <SelectTrigger className="w-[120px] border-app-gray-300">
//                                     <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                     <SelectItem value="all">Todos</SelectItem>
//                                     <SelectItem value="active">Activos</SelectItem>
//                                     <SelectItem value="inactive">Inactivos</SelectItem>
//                                 </SelectContent>
//                             </Select>
//                         </div>
//                     </div>

//                     {/* User List */}
//                     <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
//                         {filteredUsers.length === 0 ? (
//                             <div className="text-center py-12">
//                                 <Users className="h-12 w-12 text-app-gray-400 mx-auto mb-4" />
//                                 <p className="text-app-gray-600 text-lg font-medium mb-2">
//                                     {searchTerm || roleFilter !== "all" || statusFilter !== "all"
//                                         ? "No se encontraron usuarios"
//                                         : "No hay usuarios registrados"}
//                                 </p>
//                                 <p className="text-app-gray-500 text-sm">
//                                     {searchTerm || roleFilter !== "all" || statusFilter !== "all"
//                                         ? "Intenta ajustar los filtros de búsqueda."
//                                         : "Comienza creando tu primer usuario del sistema."}
//                                 </p>
//                             </div>
//                         ) : (
//                             filteredUsers.map((u) => (
//                                 <div
//                                     key={u.id}
//                                     className="flex items-center justify-between p-4 border border-app-gray-200 rounded-lg bg-app-gray-50 hover:bg-app-gray-100 transition-colors"
//                                 >
//                                     <div className="flex-1">
//                                         <div className="flex items-center gap-3 mb-2">
//                                             <h4 className="font-medium text-app-gray-900">{u.name}</h4>

//                                             <Badge className={`text-xs ${getRoleBadgeColor(u.role?.name)} flex items-center gap-1`}>
//                                                 {getRoleIcon(u.role?.name)}
//                                                 {ROLE_LABELS[u.role?.name] || u.role?.name}
//                                             </Badge>
//                                             {u.isActive ? (
//                                                 <Badge className="text-xs bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
//                                                     <UserCheck className="h-3 w-3" />
//                                                     Activo
//                                                 </Badge>
//                                             ) : (
//                                                 <Badge className="text-xs bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
//                                                     <UserX className="h-3 w-3" />
//                                                     Inactivo
//                                                 </Badge>
//                                             )}
//                                         </div>
//                                         <p className="text-sm text-app-gray-600 mb-1">{u.email}</p>
//                                         <div className="flex items-center gap-4 text-xs text-app-gray-500">  
//                                             {u.towers && u.towers.length > 0 && (
//                                                 <span className="flex items-center gap-1">
//                                                     <Building className="h-3 w-3" />
//                                                     Torres: {u.towers?.map(tower => tower.name).join(", ")}
//                                                 </span>
//                                             )}
//                                         </div>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => handleEditUser(u)}
//                                             className="border-app-blue-600 text-app-blue-600 hover:bg-app-blue-50"
//                                         >
//                                             <Edit className="h-4 w-4" />
//                                         </Button>
//                                         <AlertDialog>
//                                             <AlertDialogTrigger asChild>
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
//                                                     disabled={u.email === "admin@company.com"}
//                                                 >
//                                                     <Trash2 className="h-4 w-4" />
//                                                 </Button>
//                                             </AlertDialogTrigger>
//                                             <AlertDialogContent className="bg-white">
//                                                 <AlertDialogHeader>
//                                                     <AlertDialogTitle className="text-app-gray-900">¿Eliminar usuario?</AlertDialogTitle>
//                                                     <AlertDialogDescription className="text-app-gray-600">
//                                                         Esta acción no se puede deshacer. Se eliminará permanentemente el usuario "{u.name}" y
//                                                         todos sus datos asociados.
//                                                     </AlertDialogDescription>
//                                                 </AlertDialogHeader>
//                                                 <AlertDialogFooter>
//                                                     <AlertDialogCancel className="border-app-gray-300 text-app-gray-700 hover:bg-app-gray-50">
//                                                         Cancelar
//                                                     </AlertDialogCancel>
//                                                     <AlertDialogAction
//                                                         onClick={() => handleDeleteUser(u.id)}
//                                                         className="bg-red-600 hover:bg-red-700 text-white"
//                                                     >
//                                                         Eliminar Usuario
//                                                     </AlertDialogAction>
//                                                 </AlertDialogFooter>
//                                             </AlertDialogContent>
//                                         </AlertDialog>
//                                     </div>
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </CardContent>
//             </Card>

//             {/* Edit User Dialog */}
//             <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
//                 <DialogContent className="bg-white max-w-md">
//                     <DialogHeader>
//                         <DialogTitle className="text-app-gray-900 flex items-center">
//                             <Edit className="mr-2 h-5 w-5 text-app-blue-600" />
//                             Editar Usuario
//                         </DialogTitle>
//                         <DialogDescription className="text-app-gray-600">
//                             Modifica la información del usuario seleccionado.
//                         </DialogDescription>
//                     </DialogHeader>
//                     {editingUser && (
//                         <form action={updateAction} className="space-y-4">
//                             <input type="hidden" name="userId" value={editingUser.id} />
//                             <div>
//                                 <Label htmlFor="edit-name" className="text-app-gray-700">
//                                     Nombre Completo
//                                 </Label>
//                                 <Input
//                                     id="edit-name"
//                                     name="name"
//                                     type="text"
//                                     defaultValue={editingUser.name}
//                                     required
//                                     className="mt-1 block w-full border-app-gray-300 focus:border-app-blue-500 focus:ring-app-blue-500"
//                                 />
//                                 {updateState.errors?.name && (
//                                     <p className="text-red-500 text-sm mt-1">{updateState.errors.name[0]}</p>
//                                 )}
//                             </div>
//                             <div>
//                                 <Label htmlFor="edit-email" className="text-app-gray-700">
//                                     Correo Electrónico
//                                 </Label>
//                                 <Input
//                                     id="edit-email"
//                                     name="email"
//                                     type="email"
//                                     defaultValue={editingUser.email}
//                                     required
//                                     className="mt-1 block w-full border-app-gray-300 focus:border-app-blue-500 focus:ring-app-blue-500"
//                                 />
//                                 {updateState.errors?.email && (
//                                     <p className="text-red-500 text-sm mt-1">{updateState.errors.email[0]}</p>
//                                 )}
//                             </div>
//                             <div>
//                                 <Label htmlFor="edit-role" className="text-app-gray-700">
//                                     Rol del Usuario
//                                 </Label>
//                                 <Select name="role" defaultValue={editingUser.role.name} required>
//                                     <SelectTrigger className="w-full mt-1 border-app-gray-300 focus:border-app-blue-500 focus:ring-app-blue-500">
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         <SelectItem value="admin">
//                                             <div className="flex items-center gap-2">
//                                                 <Shield className="h-4 w-4 text-red-600" />
//                                                 Administrador
//                                             </div>
//                                         </SelectItem>
//                                         <SelectItem value="client">
//                                             <div className="flex items-center gap-2">
//                                                 <UserIcon className="h-4 w-4 text-blue-600" />
//                                                 Cliente
//                                             </div>
//                                         </SelectItem>
//                                         <SelectItem value="technician">
//                                             <div className="flex items-center gap-2">
//                                                 <Building className="h-4 w-4 text-green-600" />
//                                                 Técnico
//                                             </div>
//                                         </SelectItem>
//                                     </SelectContent>
//                                 </Select>
//                                 {updateState.errors?.role && (
//                                     <p className="text-red-500 text-sm mt-1">{updateState.errors.role[0]}</p>
//                                 )}
//                             </div>
//                             <div>
//                                 <Label htmlFor="edit-towerIds" className="text-app-gray-700">
//                                     Torres Asignadas
//                                 </Label>
//                                 <Input
//                                     id="edit-towerIds"
//                                     name="towerIds"
//                                     type="text"
//                                     defaultValue={editingUser.towers?.join(", ") || ""}
//                                     placeholder="Ej: 1, 2, 5"
//                                     className="mt-1 block w-full border-app-gray-300 focus:border-app-blue-500 focus:ring-app-blue-500"
//                                 />
//                                 {updateState.errors?.towerIds && (
//                                     <p className="text-red-500 text-sm mt-1">{updateState.errors.towerIds[0]}</p>
//                                 )}
//                             </div>
//                             <div className="flex items-center space-x-2">
//                                 <Checkbox id="edit-isActive" name="isActive" defaultChecked={editingUser.isActive} />
//                                 <Label htmlFor="edit-isActive" className="text-app-gray-700">
//                                     Usuario Activo
//                                 </Label>
//                             </div>
//                             {updateState.message && (
//                                 <div
//                                     className={`p-3 rounded-md text-sm ${updateState.success ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}
//                                 >
//                                     {updateState.message}
//                                 </div>
//                             )}
//                             <DialogFooter>
//                                 <Button
//                                     type="button"
//                                     variant="outline"
//                                     onClick={() => setIsEditDialogOpen(false)}
//                                     className="border-app-gray-300 text-app-gray-700 hover:bg-app-gray-50"
//                                 >
//                                     Cancelar
//                                 </Button>
//                                 <Button
//                                     type="submit"
//                                     className="bg-app-green-600 hover:bg-app-green-700 text-white"
//                                     disabled={isUpdating}
//                                 >
//                                     {isUpdating ? (
//                                         <>
//                                             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                             Actualizando...
//                                         </>
//                                     ) : (
//                                         <>
//                                             <Edit className="mr-2 h-4 w-4" />
//                                             Actualizar Usuario
//                                         </>
//                                     )}
//                                 </Button>
//                             </DialogFooter>
//                         </form>
//                     )}
//                 </DialogContent>
//             </Dialog>

//         </div>
//     )
// }
