import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { telemetryService, type TelemetryData, type TelemetryTimeSeriesPoint } from '@/lib/api';
import { useTelemetrySocket } from './useTelemetrySocket';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

export interface UseTelemetryOptions {
  includeTimeSeries?: boolean;
}

export function useTelemetry(bridgeId?: string, options?: UseTelemetryOptions) {
  const { includeTimeSeries = true } = options || {};
  
  // Socket para dados em tempo real
  const { realtimeData, timeSeriesHistory, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // HTTP ÚNICA para dados iniciais - só executa 1 vez no mount
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    staleTime: Infinity,  // Nunca refetch automático - WebSocket assume
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',  // Sempre busca ao montar (1 vez)
    refetchOnReconnect: false,
  });

  // HTTP para série temporal (gráficos) - SÓ se includeTimeSeries=true
  const timeSeriesQuery = useQuery({
    queryKey: ['telemetry', 'timeseries', bridgeId],
    queryFn: () => telemetryService.getHistoryTimeSeries(bridgeId!, { limit: 100 }),
    enabled: !!bridgeId && includeTimeSeries,
    staleTime: Infinity,  // Nunca refetch automático - WebSocket faz append
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
  });

  // Combinar: HTTP inicial + WebSocket realtime
  const latestData = useMemo(() => {
    const httpData = latestQuery.data || [];
    
    // Clonar para não mutar array original
    const merged = [...httpData];
    
    // WebSocket atualiza em tempo real (substitui valores existentes)
    realtimeData.forEach((rt) => {
      const idx = merged.findIndex((m) => m.deviceId === rt.deviceId);
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...rt };
      } else {
        merged.push(rt);
      }
    });

    return merged;
  }, [latestQuery.data, realtimeData]);

  // TimeSeries: HTTP inicial + WebSocket append
  const timeSeriesData = useMemo(() => {
    if (!includeTimeSeries) return [];
    
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

    // Merge, ordenar e manter últimos 200 pontos
    return [...historical, ...uniqueNew]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-200);
  }, [timeSeriesQuery.data, timeSeriesHistory, bridgeId, includeTimeSeries]);

  return {
    latestData,
    timeSeriesData,
    realtimeData,
    isLoading: latestQuery.isLoading,
    isLoadingTimeSeries: timeSeriesQuery.isLoading,
    isConnected,
    lastUpdate,
    refetchLatest: latestQuery.refetch,
    refetchTimeSeries: timeSeriesQuery.refetch,
  };
}

export function useTelemetryByCompany(companyId?: string) {
  return useQuery({
    queryKey: ['telemetry', 'company', companyId],
    queryFn: () => telemetryService.getLatestByCompany(companyId!),
    enabled: !!companyId,
    staleTime: Infinity,  // WebSocket assume
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
  });
}
