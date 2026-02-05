import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { telemetryService, type TelemetryData, type TelemetryTimeSeriesPoint } from '@/lib/api';
import { useTelemetrySocket, type TimeSeriesHistoryPoint } from './useTelemetrySocket';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

export function useTelemetry(bridgeId?: string) {
  // Socket para dados em tempo real
  const { realtimeData, timeSeriesHistory, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // HTTP para dados iniciais (modo_operacao)
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    staleTime: 60000,
  });

  // HTTP para histórico inicial
  const historyQuery = useQuery({
    queryKey: ['telemetry', 'history', bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
    staleTime: 60000,
  });

  // HTTP para série temporal (gráficos) - limit: 100
  const timeSeriesQuery = useQuery({
    queryKey: ['telemetry', 'timeseries', bridgeId],
    queryFn: () => telemetryService.getHistoryTimeSeries(bridgeId!, { limit: 100 }),
    enabled: !!bridgeId,
    staleTime: 5 * 60 * 1000, // 5 minutos - WebSocket atualiza em tempo real
  });

  // Combinar: HTTP inicial + WebSocket realtime
  // Prioriza latestQuery (mais rápido) para mostrar valores imediatamente
  const combinedData = useMemo(() => {
    const latestModes = latestQuery.data || [];
    const historyData = historyQuery.data || [];

    // Criar mapa de histórico para enriquecer depois
    const historyByDevice = new Map<string, TelemetryData>();
    historyData.forEach((h) => historyByDevice.set(h.deviceId, h));

    // Base: latestQuery (rápido) → mostra valores imediatamente
    let merged: TelemetryData[] = latestModes.length > 0 
      ? latestModes.map((latest) => ({
          // Enriquecer com dados do histórico se disponível
          ...(historyByDevice.get(latest.deviceId) || {}),
          ...latest, // latest sobrescreve para garantir valor mais recente
        }))
      : historyData; // Fallback para histórico se latest vazio

    // WebSocket: atualizar dados em tempo real
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

  // Combinar timeSeries da API + dados acumulados do WebSocket (timeSeriesHistory)
  const timeSeriesData = useMemo(() => {
    const historical = timeSeriesQuery.data || [];

    // Converter timeSeriesHistory do WebSocket para formato TelemetryTimeSeriesPoint
    const wsPoints: TelemetryTimeSeriesPoint[] = timeSeriesHistory.map(p => ({
      deviceId: p.deviceId,
      bridgeId: bridgeId || '',
      timestamp: p.timestamp,
      type: p.type,
      value: p.value,
      peak2: p.peak2,
      severity: p.severity,
    }));

    // Evitar duplicatas por deviceId + timestamp
    const existingKeys = new Set(
      historical.map(p => `${p.deviceId}-${p.timestamp}`)
    );
    const uniqueNew = wsPoints.filter(
      p => !existingKeys.has(`${p.deviceId}-${p.timestamp}`)
    );

    // Append e ordenar
    const merged = [...historical, ...uniqueNew].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Manter últimos 200 pontos para evitar crescimento infinito
    return merged.slice(-200);
  }, [timeSeriesQuery.data, timeSeriesHistory, bridgeId]);

  return {
    latestData: combinedData,
    historyData: historyQuery.data || [],
    timeSeriesData,
    realtimeData,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isLoadingTimeSeries: timeSeriesQuery.isLoading,
    isLoading: latestQuery.isLoading || historyQuery.isLoading,
    isConnected,
    lastUpdate,
    refetchLatest: latestQuery.refetch,
    refetchHistory: historyQuery.refetch,
    refetchTimeSeries: timeSeriesQuery.refetch,
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
