"use client"

import { useAuth } from "@/providers/AuthProvider" // Cambia el import
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BarChart, FileText, Group, LayoutDashboard, LogOut, Shield, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, logout, isLoading } = useAuth()
  
  console.log('NavBar - user:', user, 'isLoading:', isLoading) // ✅ Debug

  const pathname = usePathname()

  if (!user || user.role === "client") {
    return null
  }

  const getInitials = (name?: string) => {
    if (!name || typeof name !== "string") return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superadmin","admin"] },
    { href: "/forms", label: "Formularios", icon: FileText, roles: ["superadmin","admin"] },
    { href: "/reports", label: "Reportes", icon: BarChart, roles: ["superadmin","admin"] },
    { href: "/users", label: "Usuarios", icon: Users, roles: ["superadmin","admin"] },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-700" />
              <span className="text-xl font-bold text-gray-900">FormManager</span>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems
                .filter((item) => user.role && item.roles.includes(user.role))
                .map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-4 py-2 rounded-md text-base font-semibold transition-all duration-200",
                        isActive
                          ? "bg-gray-100 text-gray-900 shadow-sm scale-100"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      style={{
                        boxShadow: isActive ? "0 2px 8px 0 rgba(60,60,60,0.06)" : undefined,
                        transition: "all 0.2s cubic-bezier(.4,0,.2,1)"
                      }}
                    >
                      <item.icon className={cn("mr-2 h-5 w-5", isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700")} />
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 bg-blue-100 text-blue-700">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={logout} className="text-gray-700 hover:bg-gray-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
