import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect, useState, useRef } from 'react';
import { telemetryService, type TelemetryData, type TelemetryTimeSeriesPoint } from '@/lib/api';
import { useTelemetrySocket, type TimeSeriesHistoryPoint } from './useTelemetrySocket';

export interface TelemetryHistoryData extends TelemetryData {
  // Extended fields for history
}

// Cache helpers
const CACHE_PREFIX = 'telemetry-cache-';

function getCachedData(bridgeId: string): TelemetryData[] {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${bridgeId}`);
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCachedData(bridgeId: string, data: TelemetryData[]): void {
  try {
    if (data.length > 0) {
      localStorage.setItem(`${CACHE_PREFIX}${bridgeId}`, JSON.stringify(data));
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function useTelemetry(bridgeId?: string) {
  // Estados locais PRIMEIRO (ordem fixa de hooks)
  const [cachedData] = useState<TelemetryData[]>(() => 
    bridgeId ? getCachedData(bridgeId) : []
  );
  const [initialPolling, setInitialPolling] = useState(true);
  
  // Socket para dados em tempo real
  const { realtimeData, timeSeriesHistory, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // HTTP para dados iniciais (modo_operacao)
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    staleTime: 60000,
  });

  // HTTP para histórico inicial (contém TODOS os sensores com último valor)
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

  // Refs para evitar dependências instáveis no useEffect de polling
  const refetchLatestRef = useRef(latestQuery.refetch);
  const refetchHistoryRef = useRef(historyQuery.refetch);
  refetchLatestRef.current = latestQuery.refetch;
  refetchHistoryRef.current = historyQuery.refetch;

  // Polling agressivo nos primeiros 5 segundos para capturar dados rapidamente
  useEffect(() => {
    if (!bridgeId || !initialPolling) return;
    
    // Polling a cada 1s por 5 segundos
    const interval = setInterval(() => {
      refetchLatestRef.current();
      refetchHistoryRef.current();
    }, 1000);
    
    // Para após 5 segundos
    const timeout = setTimeout(() => {
      setInitialPolling(false);
    }, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [bridgeId, initialPolling]);

  // Combinar: HTTP inicial + WebSocket realtime
  // IMPORTANTE: historyData como base (tem TODOS sensores com último valor conhecido)
  const combinedData = useMemo(() => {
    const latestModes = latestQuery.data || [];
    const historyData = historyQuery.data || [];

    // Criar mapa de latest para sobrescrever histórico quando há dados mais recentes
    const latestByDevice = new Map<string, TelemetryData>();
    latestModes.forEach((l) => latestByDevice.set(l.deviceId, l));

    // BASE: historyData (tem todos sensores, mesmo offline)
    // ENRIQUECE: com latestQuery (dados mais recentes se disponíveis)
    let merged: TelemetryData[] = historyData.length > 0 
      ? historyData.map((history) => ({
          ...history,  // Base: último valor do histórico (sempre presente)
          ...(latestByDevice.get(history.deviceId) || {}),  // Sobrescreve se tiver latest mais recente
        }))
      : latestModes;  // Fallback se histórico vazio

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

  // Persistir dados no cache sempre que combinedData atualizar
  useEffect(() => {
    if (bridgeId && combinedData.length > 0) {
      setCachedData(bridgeId, combinedData);
    }
  }, [bridgeId, combinedData]);

  // Dados finais: usar cache enquanto loading, depois dados frescos
  const isLoading = latestQuery.isLoading || historyQuery.isLoading;
  const hasData = combinedData.length > 0;
  const hasCachedData = cachedData.length > 0;
  
  // Retornar cache se ainda carregando e não tem dados frescos
  const latestData = useMemo(() => {
    if (hasData) return combinedData;
    if (isLoading && hasCachedData) return cachedData;
    return combinedData;
  }, [hasData, isLoading, hasCachedData, combinedData, cachedData]);

  // Flag para indicar se está mostrando dados do cache
  const isFromCache = isLoading && !hasData && hasCachedData;

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
    latestData,
    historyData: historyQuery.data || [],
    timeSeriesData,
    realtimeData,
    isLoadingLatest: latestQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,
    isLoadingTimeSeries: timeSeriesQuery.isLoading,
    isLoading,
    isFromCache,
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
