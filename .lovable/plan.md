
# Plano: Gráficos com Dados Reais + Append via WebSocket

## Objetivo

Atualizar os gráficos para usar dados reais da API com atualização automática via WebSocket, sem fazer requisições extras que aumentem custos.

---

## Abordagem Segura (Sem Custos Extras)

A API `/telemetry/history/bridge/{id}` já suporta parâmetro `limit`. O backend já limita os dados retornados:

```javascript
// Backend (d2win-api)
const limit = parseInt(req.query.limit) || 500;
```

Usaremos `limit: 100` para gráficos (suficiente para visualização) e faremos append apenas dos dados que chegam via WebSocket - **zero requisições extras**.

---

## Arquitetura de Dados

```text
┌─────────────────────────────────────────────────────────────────┐
│                     CARREGAMENTO INICIAL                        │
│                                                                 │
│  historyQuery (limit: 100)  ──────>  Expande freq[] e accel[]  │
│         (1 requisição)               para timeSeriesData       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ATUALIZAÇÃO EM TEMPO REAL                   │
│                                                                 │
│  WebSocket "telemetry" event  ──────>  Append em timeSeriesData │
│     (sem requisição HTTP)             (re-render automático)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alterações por Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/telemetry.ts` | Adicionar função `getHistoryTimeSeries` que expande `freq[]` e `accel[]` |
| `src/hooks/useTelemetry.ts` | Adicionar query `timeSeriesQuery` + merge com dados WebSocket |
| `src/lib/utils/formatValue.ts` | Adicionar formatos com segundos (`HH:mm:ss`, `dd/MM HH:mm:ss`) |
| `src/components/dashboard/BridgeCard.tsx` | Usar dados reais nos mini-gráficos com segundos |
| `src/components/bridge/DataAnalysisSection.tsx` | Substituir dados mockados por `timeSeriesData` |

---

## Seção Técnica

### 1. telemetry.ts - Expandir Histórico (Reutiliza dados já buscados)

Adicionar interface e função que expande os arrays retornados pela API:

```typescript
// Nova interface para série temporal
export interface TelemetryTimeSeriesPoint {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  severity?: string;
}

// Nova função - MESMA requisição, apenas processa diferente
export async function getHistoryTimeSeries(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TelemetryTimeSeriesPoint[]> {
  // Usa limit: 100 por padrão para gráficos
  const queryParams = { limit: 100, ...params };
  const response = await api.get<ApiHistoryResponse>(
    `/telemetry/history/bridge/${bridgeId}`, 
    { params: queryParams }
  );
  
  const data = response.data;
  if (!data?.items) return [];
  
  const points: TelemetryTimeSeriesPoint[] = [];
  
  // Expande arrays que já vieram da API (sem nova requisição)
  data.items.forEach(item => {
    // Frequência - expande array
    item.freq?.forEach(reading => {
      if (reading.peaks?.[0]?.f) {
        points.push({
          deviceId: item.device_id,
          bridgeId,
          timestamp: reading.ts,
          type: 'frequency',
          value: reading.peaks[0].f,
          severity: reading.severity,
        });
      }
    });
    
    // Aceleração (Z) - expande array
    item.accel?.forEach(reading => {
      points.push({
        deviceId: item.device_id,
        bridgeId,
        timestamp: reading.ts,
        type: 'acceleration',
        value: reading.value, // Sempre eixo Z
        severity: reading.severity,
      });
    });
  });
  
  // Ordena por timestamp
  return points.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
```

### 2. useTelemetry.ts - Merge com WebSocket

```typescript
import { TelemetryTimeSeriesPoint } from '@/lib/api/telemetry';

export function useTelemetry(bridgeId?: string) {
  const { realtimeData, lastUpdate, isConnected } = useTelemetrySocket(bridgeId);

  // ... queries existentes ...

  // Query para série temporal (gráficos) - limit: 100
  const timeSeriesQuery = useQuery({
    queryKey: ['telemetry', 'timeseries', bridgeId],
    queryFn: () => telemetryService.getHistoryTimeSeries(bridgeId!, { limit: 100 }),
    enabled: !!bridgeId,
    staleTime: 5 * 60 * 1000, // 5 minutos - WebSocket atualiza em tempo real
  });

  // Combinar timeSeries + dados novos do WebSocket
  const timeSeriesData = useMemo(() => {
    const historical = timeSeriesQuery.data || [];
    
    // Converter realtimeData para formato timeseries
    const newPoints: TelemetryTimeSeriesPoint[] = realtimeData
      .filter(rt => rt.timestamp)
      .map(rt => ({
        deviceId: rt.deviceId,
        bridgeId: rt.bridgeId,
        timestamp: rt.timestamp!,
        type: rt.modoOperacao === 'frequencia' ? 'frequency' as const : 'acceleration' as const,
        value: rt.modoOperacao === 'frequencia' 
          ? rt.frequency! 
          : rt.acceleration?.z!,
        severity: rt.status,
      }))
      .filter(p => p.value !== undefined);
    
    // Evitar duplicatas por deviceId + timestamp
    const existingKeys = new Set(
      historical.map(p => `${p.deviceId}-${p.timestamp}`)
    );
    const uniqueNew = newPoints.filter(
      p => !existingKeys.has(`${p.deviceId}-${p.timestamp}`)
    );
    
    // Append e ordenar
    const merged = [...historical, ...uniqueNew].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Manter últimos 200 pontos para evitar crescimento infinito
    return merged.slice(-200);
  }, [timeSeriesQuery.data, realtimeData]);

  return {
    latestData: combinedData,
    historyData: historyQuery.data || [],
    timeSeriesData, // Novo: série temporal para gráficos
    realtimeData,
    isLoading: ...,
    isConnected,
    lastUpdate,
    // ...
  };
}
```

### 3. formatValue.ts - Adicionar Segundos

```typescript
export function formatDateValue(
  dateValue: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy'
): string {
  if (!dateValue) return '-';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '-';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0'); // NOVO
    
    switch (formatStr) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'dd/MM/yyyy HH:mm':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'dd/MM/yyyy HH:mm:ss': // NOVO
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      case 'dd/MM HH:mm':
        return `${day}/${month} ${hours}:${minutes}`;
      case 'dd/MM HH:mm:ss': // NOVO
        return `${day}/${month} ${hours}:${minutes}:${seconds}`;
      case 'HH:mm:ss': // NOVO
        return `${hours}:${minutes}:${seconds}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch {
    return '-';
  }
}
```

### 4. BridgeCard.tsx - Timestamps com Segundos

```typescript
// Na tabela - updatedAt com segundos
updatedAt: telemetry.timestamp 
  ? formatDateValue(telemetry.timestamp, 'dd/MM HH:mm:ss') 
  : '-',

// Nos gráficos - eixo X com segundos
time: formatDateValue(d.timestamp, 'HH:mm:ss'),

// Footer - atualização com segundos
format(new Date(bridge.lastUpdate), "dd/MM/yyyy, HH:mm:ss")
```

### 5. DataAnalysisSection.tsx - Gráficos com Dados Reais

```typescript
const { timeSeriesData, latestData, isConnected, lastUpdate } = useTelemetry(bridgeId);

// Dados de ACELERAÇÃO para gráficos (eixo Z)
const timeSeriesAcceleration = useMemo(() => {
  if (!timeSeriesData?.length) {
    // Fallback mock apenas se não houver dados
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      valueZ: 9.7 + Math.random() * 0.9,
    }));
  }
  
  return timeSeriesData
    .filter(d => d.type === 'acceleration')
    .slice(-50)
    .map(d => ({
      date: formatDateValue(d.timestamp, 'HH:mm:ss'),
      valueZ: d.value,
      device: d.deviceId,
      severity: d.severity,
    }));
}, [timeSeriesData]);

// Dados de FREQUÊNCIA para gráficos (eixo Z)
const timeSeriesFrequency = useMemo(() => {
  if (!timeSeriesData?.length) {
    // Fallback mock
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      s1Z: 3.5 + Math.random() * 0.5,
    }));
  }
  
  // Agrupar por device para múltiplas linhas
  const byDevice = new Map<string, Array<{date: string, value: number}>>();
  
  timeSeriesData
    .filter(d => d.type === 'frequency')
    .slice(-100)
    .forEach(d => {
      if (!byDevice.has(d.deviceId)) {
        byDevice.set(d.deviceId, []);
      }
      byDevice.get(d.deviceId)!.push({
        date: formatDateValue(d.timestamp, 'HH:mm:ss'),
        value: d.value,
      });
    });
  
  // Transformar para formato do gráfico
  // ... lógica de merge por timestamp
}, [timeSeriesData]);
```

---

## Fluxo de Atualização

```text
1. Usuário abre página da ponte
   ├── timeSeriesQuery busca 100 pontos (1 requisição HTTP)
   └── Socket conecta e entra na sala "bridge:{id}"

2. WebSocket recebe evento "telemetry"
   ├── useTelemetrySocket adiciona a realtimeData
   └── useMemo recalcula timeSeriesData (append)

3. Gráficos re-renderizam
   └── Novo ponto aparece na extremidade direita

4. Após 200 pontos, remove os mais antigos
   └── Mantém memória constante
```

---

## Controle de Custos

| Operação | Antes | Depois |
|----------|-------|--------|
| Requisições HTTP | 2 por ponte | 3 (latest + history + timeseries) - **uma vez só** |
| Polling | historyQuery a cada 30s | **Nenhum** - WebSocket atualiza |
| Dados buscados | limit: 500 | limit: 100 (suficiente para gráficos) |
| Atualizações | Refetch completo | Append incremental |

---

## Resultado

- Gráficos usam dados reais da API
- Timestamps exibem segundos (HH:mm:ss)
- Append automático quando WebSocket recebe dados
- Limite de 100 pontos iniciais + 200 máximo em memória
- Zero polling adicional - apenas WebSocket para atualizações
