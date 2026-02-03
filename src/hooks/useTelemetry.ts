import { useQuery } from '@tanstack/react-query';
import { telemetryService, type TelemetryData } from '@/lib/api';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

export function useTelemetry(bridgeId?: string) {
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    refetchInterval: 30000, // Atualiza a cada 30s
    staleTime: 10000,
  });

  const historyQuery = useQuery({
    queryKey: ['telemetry', 'history', bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
    staleTime: 60000, // Cache por 1 minuto
  });

  return {
    latestData: latestQuery.data || [],
    historyData: historyQuery.data || [],
    isLoadingLatest: latestQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isLoading: latestQuery.isLoading || historyQuery.isLoading,
    refetchLatest: latestQuery.refetch,
    refetchHistory: historyQuery.refetch,
  };
}

export function useTelemetryByCompany(companyId?: string) {
  return useQuery({
    queryKey: ['telemetry', 'company', companyId],
    queryFn: () => telemetryService.getLatestByCompany(companyId!),
    enabled: !!companyId,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
