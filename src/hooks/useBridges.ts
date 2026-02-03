import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bridgesService, type ApiBridge } from '@/lib/api';
import type { Bridge } from '@/types';
import { toast } from 'sonner';

export function useBridges(companyId?: string) {
  const queryClient = useQueryClient();

  const { 
    data: bridges = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['bridges', companyId],
    queryFn: () => bridgesService.getBridges(companyId === 'all' ? undefined : companyId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ApiBridge>) => bridgesService.createBridge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges'] });
      toast.success('Ponte criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar ponte');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiBridge> }) =>
      bridgesService.updateBridge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges'] });
      toast.success('Ponte atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar ponte');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bridgesService.deleteBridge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bridges'] });
      toast.success('Ponte excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir ponte');
    },
  });

  return {
    bridges,
    isLoading,
    error,
    refetch,
    createBridge: createMutation.mutate,
    updateBridge: updateMutation.mutate,
    deleteBridge: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useBridge(id: string | undefined) {
  const { 
    data: bridge, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['bridge', id],
    queryFn: () => bridgesService.getBridge(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return { bridge, isLoading, error };
}
