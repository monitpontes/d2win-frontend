import { useQuery } from '@tanstack/react-query';
import { bridgeLimitsService, DEFAULT_LIMITS, type BridgeLimits } from '@/lib/api/bridgeLimits';

export function useBridgeLimits(bridgeId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bridge-limits', bridgeId],
    queryFn: () => bridgeLimitsService.getBridgeLimits(bridgeId!),
    enabled: !!bridgeId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
  });

  // Return limits with fallback to defaults
  const limits: Omit<BridgeLimits, 'id' | 'bridgeId'> = {
    freqAlert: data?.freqAlert ?? DEFAULT_LIMITS.freqAlert,
    freqCritical: data?.freqCritical ?? DEFAULT_LIMITS.freqCritical,
    accelAlert: data?.accelAlert ?? DEFAULT_LIMITS.accelAlert,
    accelCritical: data?.accelCritical ?? DEFAULT_LIMITS.accelCritical,
  };

  return {
    limits,
    rawLimits: data,
    isLoading,
    error,
    refetch,
  };
}
