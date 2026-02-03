import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/lib/api';
import type { Company } from '@/types';
import { toast } from 'sonner';

export function useCompanies() {
  const queryClient = useQueryClient();

  const { 
    data: companies = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesService.getCompanies,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
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
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string } }) =>
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
