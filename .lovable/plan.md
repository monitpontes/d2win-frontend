
# Plano: Otimizar Chamadas HTTP - 1 Query Inicial + WebSocket

## Objetivo

Reduzir drasticamente as queries ao banco de dados:
- Dashboard: 1x `/latest` + 1x `/timeseries`
- BridgePage: 1x `/latest` + 1x `/timeseries`
- WebSocket assume imediatamente após carga inicial

## Mudanças

### 1. src/hooks/useTelemetry.ts (reescrever)

**Remover:**
- Cache localStorage (desnecessário com WebSocket)
- Polling de 5 segundos
- `historyQuery` (não usado)
- Estados `initialPolling` e `cachedData`

**Manter:**
- `latestQuery` - 1 chamada no mount
- `timeSeriesQuery` - 1 chamada no mount (para gráficos)
- WebSocket merge para atualizações em tempo real

**Código otimizado:**

```typescript
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
```

### 2. Componentes que usam useTelemetry (verificar compatibilidade)

Os componentes que usam `historyData`, `isFromCache`, `isLoadingHistory`, `isLoadingLatest`, `refetchHistory` precisam ser atualizados:

| Propriedade Removida | Substituição |
|---------------------|--------------|
| `historyData` | Remover uso (não utilizado) |
| `isFromCache` | Remover (cache eliminado) |
| `isLoadingHistory` | Usar `isLoading` |
| `isLoadingLatest` | Usar `isLoading` |
| `refetchHistory` | Remover |

## Fluxo Final

```text
┌─────────────────────────────────────────────────────────────┐
│  Página carrega (Dashboard ou BridgePage)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1x GET /telemetry/latest → valores para cards              │
│  1x GET /telemetry/timeseries → dados para gráficos         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  WebSocket conecta → join_bridge                            │
│  Eventos "telemetry" atualizam em tempo real                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Nenhuma query HTTP adicional                               │
│  Apenas WebSocket mantém dados atualizados                  │
└─────────────────────────────────────────────────────────────┘
```

## Economia

| Métrica | Antes | Depois |
|---------|-------|--------|
| Queries iniciais | 3 | 2 |
| Polling (5s) | ~10 queries | 0 |
| Total por carga | ~13 queries | 2 queries |
| Redução | - | **~85%** |
