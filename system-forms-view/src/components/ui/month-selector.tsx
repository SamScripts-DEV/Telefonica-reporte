"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"

interface MonthSelectorProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
    className?: string
}

const MONTH_OPTIONS = [
    { value: "3", label: "Últimos 3 meses" },
    { value: "6", label: "Últimos 6 meses" },
    { value: "12", label: "Último año" },
] as const

export function MonthSelector({ 
    value, 
    onValueChange, 
    disabled = false,
    className = "w-[140px]"
}: MonthSelectorProps) {
    const getSelectedLabel = (selectedValue: string) => {
        return MONTH_OPTIONS.find(option => option.value === selectedValue)?.label || "Seleccionar período"
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={`${className} justify-between h-10 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1`}
                    disabled={disabled}
                >
                    <span className="block truncate">
                        {getSelectedLabel(value)}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className={`${className} max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md`}
                sideOffset={4}
            >
                {MONTH_OPTIONS.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onValueChange(option.value)}
                        className={`
                            relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none 
                            focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50
                            ${value === option.value ? "bg-accent text-accent-foreground" : ""}
                        `}
                    >
                        {value === option.value && (
                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                <Check className="h-4 w-4" />
                            </span>
                        )}
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}