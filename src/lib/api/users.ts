import api from './client';
import type { User, UserRole } from '@/types';
import { mapApiUserToUser, type ApiUser } from './auth';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id: string;
}

export interface UpdateUserData {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export async function getUsers(companyId?: string): Promise<User[]> {
  const params = companyId ? { company_id: companyId } : {};
  const response = await api.get<ApiUser[]>('/users', { params });
  return response.data.map(mapApiUserToUser);
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get<ApiUser>(`/users/${id}`);
  return mapApiUserToUser(response.data);
}

export async function createUser(data: CreateUserData): Promise<User> {
  const response = await api.post<ApiUser>('/users', data);
  return mapApiUserToUser(response.data);
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  const response = await api.put<ApiUser>(`/users/${id}`, data);
  return mapApiUserToUser(response.data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export const usersService = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
