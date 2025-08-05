export interface CreateSystemUserDto {
  name: string;
  email: string;
  password: string;
  roleId: number;
  isActive: boolean;
  towerIds: number[];
  groupIds: number[];
}

export interface CreateTechnicianDto {
  name: string;
  towerId: number;
  
}