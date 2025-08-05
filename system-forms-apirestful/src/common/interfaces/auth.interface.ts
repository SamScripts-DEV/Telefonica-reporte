export interface JwtPayload {
  sub: string;
  email: string;
  roleId: number;
  roleName: string;
  towerIds: number[];
  iat?: number;
  exp?: number;
}

export interface RequestUser extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string; // <-- Add this line
  towers?: Array<{
    id: number;
    name: string;
  }>;
}
