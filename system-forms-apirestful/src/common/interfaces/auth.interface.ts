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
}
