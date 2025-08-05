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


export const getTowerColor = (index: number): string => {
  return TOWER_COLORS[index % TOWER_COLORS.length];
};


export const getFormHeaderColor = (index: number): string => {
  return FORM_HEADER_COLORS[index % FORM_HEADER_COLORS.length];
};