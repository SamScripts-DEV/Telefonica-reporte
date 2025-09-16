export const TOWER_COLORS = [
  "bg-blue-500",
  "bg-green-500", 
  "bg-orange-500",
  "bg-gray-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-yellow-500",
  "bg-red-500"
] as const;

export const FORM_HEADER_COLORS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-orange-600",
  "bg-gray-600",
  "bg-purple-600",
  "bg-teal-600"
] as const;

// Cambiar esta función para retornar el estilo inline
export const getTowerColor = (index: number): string => {
  const colors = [
    "#3b82f6", // blue-500
    "#10b981", // green-500
    "#f97316", // orange-500
    "#6b7280", // gray-500
    "#8b5cf6", // purple-500
    "#14b8a6", // teal-500
    "#6366f1", // indigo-500
    "#ec4899", // pink-500
    "#eab308", // yellow-500
    "#ef4444"  // red-500
  ];
  return colors[index % colors.length];
};

export const getFormHeaderColor = (index: number): string => {
  const colors = [
    "#2563eb", // blue-600
    "#16a34a", // green-600
    "#ea580c", // orange-600
    "#4b5563", // gray-600
    "#7c3aed", // purple-600
    "#0d9488"  // teal-600
  ];
  return colors[index % colors.length];
};

// Nuevos colores suaves para formularios del cliente
export const CLIENT_FORM_COLORS = [
  "#f0f9ff", // blue-50 background
  "#f0fdf4", // green-50 background  
  "#fff7ed", // orange-50 background
  "#f9fafb", // gray-50 background
  "#faf5ff", // purple-50 background
  "#f0fdfa"  // teal-50 background
] as const;

export const CLIENT_FORM_BORDER_COLORS = [
  "#3b82f6", // blue-500 border
  "#10b981", // emerald-500 border
  "#f59e0b", // amber-500 border
  "#6b7280", // gray-500 border
  "#8b5cf6", // violet-500 border
  "#14b8a6"  // teal-500 border
] as const;

export const getClientFormColors = (index: number) => {
  return {
    background: CLIENT_FORM_COLORS[index % CLIENT_FORM_COLORS.length],
    border: CLIENT_FORM_BORDER_COLORS[index % CLIENT_FORM_BORDER_COLORS.length]
  };
};

export const getTowerColorById = (id: number | string): string => {
  // Convierte el ID a número y usa módulo para asignar color
  const numId = Number(id);
  return TOWER_COLORS[numId % TOWER_COLORS.length];
};