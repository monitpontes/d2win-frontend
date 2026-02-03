import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { telemetryService, type TelemetryData } from '@/lib/api';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

export function useTelemetry(bridgeId?: string) {
  // Query for latest data - gives us modo_operacao for each device
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    refetchInterval: 30000, // Atualiza a cada 30s
    staleTime: 10000,
  });

  // Query for history data - gives us actual values from freq/accel arrays
  const historyQuery = useQuery({
    queryKey: ['telemetry', 'history', bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
    staleTime: 60000, // Cache por 1 minuto
  });

  // Combine data: modo_operacao from latest + values from history
  const combinedData = useMemo(() => {
    const historyData = historyQuery.data || [];
    const latestDataRaw = latestQuery.data || [];
    
    // If we have no history, return latest data (may have null values)
    if (historyData.length === 0) {
      return latestDataRaw;
    }
    
    // Create map of modo_operacao from latest endpoint
    const modeByDevice = new Map<string, string>();
    latestDataRaw.forEach(d => {
      if (d.modoOperacao) {
        modeByDevice.set(d.deviceId, d.modoOperacao);
      }
    });
    
    // Merge: use values from history but prefer modo_operacao from latest if available
    return historyData.map(h => ({
      ...h,
      modoOperacao: modeByDevice.get(h.deviceId) || h.modoOperacao,
    }));
  }, [latestQuery.data, historyQuery.data]);

  return {
    latestData: combinedData,
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
