import api from './client';
import type { User, UserRole } from '@/types';

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    company_id: string;
    isActive: boolean;
  };
}

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
  isActive: boolean;
  createdAt?: string;
}

// Mapeia usuário da API para formato do frontend
export function mapApiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser._id,
    email: apiUser.email,
    name: apiUser.name,
    role: apiUser.role,
    companyId: apiUser.company_id,
    status: apiUser.isActive ? 'active' : 'inactive',
    createdAt: apiUser.createdAt || new Date().toISOString(),
  };
}

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  const { token, user } = response.data;
  return {
    token,
    user: mapApiUserToUser(user),
  };
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiUser>('/auth/me');
  return mapApiUserToUser(response.data);
}

export const authService = {
  login,
  getCurrentUser,
};
