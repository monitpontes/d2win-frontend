import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { telemetryService, type TelemetryData } from '@/lib/api';
import { useTelemetrySocket } from './useTelemetrySocket';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

export function useTelemetry(bridgeId?: string) {
  // Socket para dados em tempo real
  const { realtimeData, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // HTTP para dados iniciais (modo_operacao)
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    staleTime: 60000, // Menos frequente - socket atualiza
  });

  // HTTP para histórico inicial
  const historyQuery = useQuery({
    queryKey: ['telemetry', 'history', bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
    staleTime: 60000,
  });

  // Combinar: HTTP inicial + WebSocket realtime
  const combinedData = useMemo(() => {
    const httpData = historyQuery.data || [];
    const latestModes = latestQuery.data || [];

    // Criar mapa de modo_operacao do latest
    const modeByDevice = new Map<string, string>();
    latestModes.forEach((d) => {
      if (d.modoOperacao) modeByDevice.set(d.deviceId, d.modoOperacao);
    });

    // Merge HTTP data com modo correto
    let merged: TelemetryData[] = httpData.map((h) => ({
      ...h,
      modoOperacao: modeByDevice.get(h.deviceId) || h.modoOperacao,
    }));

    // Sobrescrever com dados realtime (mais recentes)
    realtimeData.forEach((rt) => {
      const idx = merged.findIndex((m) => m.deviceId === rt.deviceId);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...rt };
      } else {
        merged.push(rt);
      }
    });

    return merged;
  }, [latestQuery.data, historyQuery.data, realtimeData]);

  return {
    latestData: combinedData,
    historyData: historyQuery.data || [],
    realtimeData,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isLoading: latestQuery.isLoading || historyQuery.isLoading,
    isConnected,
    lastUpdate,
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
