export interface Tower {
  id: string;
  name: string;
  // ✅ AGREGAR: Propiedades que vienen del backend
  technicians?: Array<{
    id: string;
    name: string;
    towerId: number;
    createdAt: string;
  }>;
  users?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  forms?: Array<any>;
}