export interface LoginDto {
    email: string,
    password: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "client" | "technician" | "superadmin";
    permissions: string[];
    // ✅ CAMBIO: towers (array) en lugar de tower (string)
    towers?: Array<{
        id: number;
        name: string;
    }>;
}