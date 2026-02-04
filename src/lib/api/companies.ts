import api from './client';
import type { Company } from '@/types';

export interface ApiCompany {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  // Campos de cadastro do cliente
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface CreateCompanyData {
  name: string;
  description?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Mapeia empresa da API para formato do frontend
export function mapApiCompanyToCompany(apiCompany: ApiCompany): Company {
  return {
    id: apiCompany._id,
    name: apiCompany.name,
    description: apiCompany.description,
    logo: apiCompany.logo,
    createdAt: apiCompany.createdAt || new Date().toISOString(),
    // Campos de cadastro
    cnpj: apiCompany.cnpj,
    email: apiCompany.email,
    phone: apiCompany.phone,
    address: apiCompany.address,
    city: apiCompany.city,
    state: apiCompany.state,
    zipCode: apiCompany.zip_code,
    contactName: apiCompany.contact_name,
    contactEmail: apiCompany.contact_email,
    contactPhone: apiCompany.contact_phone,
  };
}

// Mapeia dados do frontend para API (snake_case)
function mapCompanyDataToApi(data: CreateCompanyData): Record<string, string | undefined> {
  return {
    name: data.name,
    description: data.description,
    cnpj: data.cnpj,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    zip_code: data.zipCode,
    contact_name: data.contactName,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone,
  };
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const response = await api.get<ApiCompany[]>('/companies');
    console.log('[Companies] Raw response:', response.data);
    console.log('[Companies] Count:', response.data?.length || 0);
    return response.data.map(mapApiCompanyToCompany);
  } catch (error) {
    console.error('[Companies] Error fetching:', error);
    throw error;
  }
}

export async function getCompany(id: string): Promise<Company> {
  const response = await api.get<ApiCompany>(`/companies/${id}`);
  return mapApiCompanyToCompany(response.data);
}

export async function createCompany(data: CreateCompanyData): Promise<Company> {
  const response = await api.post<ApiCompany>('/companies', mapCompanyDataToApi(data));
  return mapApiCompanyToCompany(response.data);
}

export async function updateCompany(id: string, data: Partial<CreateCompanyData>): Promise<Company> {
  const apiData = data.name ? mapCompanyDataToApi(data as CreateCompanyData) : data;
  const response = await api.put<ApiCompany>(`/companies/${id}`, apiData);
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
