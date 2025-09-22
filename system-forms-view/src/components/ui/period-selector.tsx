// filepath: c:\Users\user\Documents\Telefonica\system-forms-view\src\components\ui\period-selector.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface PeriodSelectorProps {
    value: string // Formato: "YYYY-MM"
    onValueChange: (value: string) => void
    disabled?: boolean
    className?: string
    placeholder?: string
}

export function PeriodSelector({ 
    value, 
    onValueChange, 
    disabled = false,
    className = "w-[180px]",
    placeholder = "Seleccionar período"
}: PeriodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    
    // Obtener año y mes actual para navegación
    const getCurrentYearMonth = () => {
        if (value) {
            const [year, month] = value.split('-')
            return { year: parseInt(year), month: parseInt(month) }
        }
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
    }

    const [viewYear, setViewYear] = useState(getCurrentYearMonth().year)
    const [viewMonth, setViewMonth] = useState(getCurrentYearMonth().month)

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const formatDisplayValue = (dateString: string): string => {
        if (!dateString) return placeholder
        const [year, month] = dateString.split('-')
        return `${months[parseInt(month) - 1]} ${year}`
    }

    const handleMonthSelect = (monthIndex: number) => {
        const formattedMonth = (monthIndex + 1).toString().padStart(2, '0')
        const newValue = `${viewYear}-${formattedMonth}`
        onValueChange(newValue)
        setIsOpen(false)
    }

    const handlePreviousYear = () => {
        setViewYear(prev => prev - 1)
    }

    const handleNextYear = () => {
        setViewYear(prev => prev + 1)
    }

    const isSelectedMonth = (monthIndex: number) => {
        if (!value) return false
        const [selectedYear, selectedMonth] = value.split('-')
        return parseInt(selectedYear) === viewYear && parseInt(selectedMonth) === monthIndex + 1
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`${className} justify-between h-10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    disabled={disabled}
                >
                    <span className="block truncate">
                        {formatDisplayValue(value)}
                    </span>
                    <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-80 p-0 z-50" // ✅ Agregar z-50 para estar encima de todo
                align="end" // ✅ Cambiar a "end" para evitar corte en el lado derecho
                side="bottom" // ✅ Asegurar que se abra hacia abajo
                sideOffset={8}
                avoidCollisions={true} // ✅ Evitar colisiones con los bordes
                collisionPadding={20} // ✅ Padding para evitar cortes
            >
                {/* Header con navegación de año */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePreviousYear}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-lg font-semibold">
                        {viewYear}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleNextYear}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Grid de meses */}
                <div className="p-4">
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month, index) => (
                            <Button
                                key={month}
                                variant={isSelectedMonth(index) ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleMonthSelect(index)}
                                className={`h-10 text-sm ${
                                    isSelectedMonth(index) 
                                        ? "bg-primary text-primary-foreground" 
                                        : "hover:bg-accent hover:text-accent-foreground"
                                }`}
                            >
                                {month.substring(0, 3)}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Footer con shortcuts */}
                <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const now = new Date()
                            const currentPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
                            onValueChange(currentPeriod)
                            setIsOpen(false)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Mes actual
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const now = new Date()
                            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                            const lastPeriod = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`
                            onValueChange(lastPeriod)
                            setIsOpen(false)
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Mes anterior
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}