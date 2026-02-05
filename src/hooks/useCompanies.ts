import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { companiesService, type CreateCompanyData } from '@/lib/api';
import type { Company } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCompanies() {
  const queryClient = useQueryClient();
  const { user, isGlobalAdmin } = useAuth();

  const { 
    data: rawCompanies = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.getCompanies,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Filtrar empresas: Admin Global vê todas, outros só veem sua empresa
  const companies = useMemo(() => {
    if (!user) return [];
    if (isGlobalAdmin()) return rawCompanies;
    // Gestor e Viewer só veem sua empresa
    return rawCompanies.filter(c => c.id === user.companyId);
  }, [rawCompanies, user, isGlobalAdmin]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyData) => 
      companiesService.createCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar empresa');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyData> }) =>
      companiesService.updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar empresa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir empresa');
    },
  });

  return {
    companies,
    allCompanies: rawCompanies, // Para uso interno quando necessário
    isLoading,
    error,
    refetch,
    createCompany: createMutation.mutate,
    updateCompany: updateMutation.mutate,
    deleteCompany: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
