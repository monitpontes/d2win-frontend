import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, type CreateUserData, type UpdateUserData } from '@/lib/api';
import type { User } from '@/types';
import { toast } from 'sonner';

export function useUsers(companyId?: string) {
  const queryClient = useQueryClient();

  const { 
    data: users = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => usersService.getUsers(companyId === 'all' ? undefined : companyId),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
