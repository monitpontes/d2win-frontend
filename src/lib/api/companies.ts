import api from './client';
import type { Company } from '@/types';

export interface ApiCompany {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
}

// Mapeia empresa da API para formato do frontend
export function mapApiCompanyToCompany(apiCompany: ApiCompany): Company {
  return {
    id: apiCompany._id,
    name: apiCompany.name,
    description: apiCompany.description,
    logo: apiCompany.logo,
    createdAt: apiCompany.createdAt || new Date().toISOString(),
  };
}

export async function getCompanies(): Promise<Company[]> {
  const response = await api.get<ApiCompany[]>('/companies');
  return response.data.map(mapApiCompanyToCompany);
}

export async function getCompany(id: string): Promise<Company> {
  const response = await api.get<ApiCompany>(`/companies/${id}`);
  return mapApiCompanyToCompany(response.data);
}

export async function createCompany(data: { name: string; description?: string }): Promise<Company> {
  const response = await api.post<ApiCompany>('/companies', data);
  return mapApiCompanyToCompany(response.data);
}

export async function updateCompany(id: string, data: { name?: string; description?: string }): Promise<Company> {
  const response = await api.put<ApiCompany>(`/companies/${id}`, data);
  return mapApiCompanyToCompany(response.data);
}

export async function deleteCompany(id: string): Promise<void> {
  await api.delete(`/companies/${id}`);
}

export const companiesService = {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
};
