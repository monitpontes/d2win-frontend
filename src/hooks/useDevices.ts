import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesService, type ApiDevice } from '@/lib/api';
import type { Sensor } from '@/types';
import { toast } from 'sonner';

export function useDevices(companyId?: string, bridgeId?: string) {
  const queryClient = useQueryClient();

  const { 
    data: devices = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['devices', companyId, bridgeId],
    queryFn: () => devicesService.getDevices(
      companyId === 'all' ? undefined : companyId, 
      bridgeId
    ),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ApiDevice>) => devicesService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar dispositivo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiDevice> }) =>
      devicesService.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar dispositivo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => devicesService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir dispositivo');
    },
  });

  return {
    devices,
    isLoading,
    error,
    refetch,
    createDevice: createMutation.mutate,
    updateDevice: updateMutation.mutate,
    deleteDevice: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
