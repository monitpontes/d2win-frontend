
# Plano: Buscar Valores Reais de Telemetria do Endpoint History

## Problema Identificado

O endpoint `/telemetry/latest/bridge/{id}` retorna `accel: null` e `freq: null` para os devices. Porém, o endpoint `/telemetry/history/bridge/{id}` retorna os dados completos com estrutura diferente:

```json
{
  "items": [
    {
      "device_id": "Motiva_P1_S01",
      "accel": [
        { "ts": "...", "value": 9.836552, "severity": "normal" }
      ],
      "freq": [
        { "ts": "...", "peaks": [{"f": 3.552246, "mag": 758.19}], "severity": "critical" }
      ]
    }
  ]
}
```

---

## Solução

Usar o endpoint `/telemetry/history/bridge/{id}` para obter os valores mais recentes de cada device, extraindo:
- **Frequência**: `freq[freq.length-1].peaks[0].f` (última leitura, primeiro pico)
- **Aceleração**: `accel[accel.length-1].value` (última leitura)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/telemetry.ts` | Atualizar mapeamento para usar estrutura do history endpoint |
| `src/hooks/useTelemetry.ts` | Modificar para processar dados do history corretamente |
| `src/components/dashboard/BridgeCard.tsx` | Usar historyData além de latestData |
| `src/components/bridge/DataAnalysisSection.tsx` | Usar dados reais de historyData nos gráficos |
| `src/pages/BridgeDetail.tsx` | Atualizar sensores 3D com dados reais |

---

## Seção Técnica

### 1. Nova Interface para History Response

```typescript
interface ApiHistoryItem {
  device_id: string;
  accel: Array<{
    ts: string;
    value: number;
    severity: string;
    meta?: { device_id: string };
  }>;
  freq: Array<{
    ts: string;
    peaks: Array<{ f: number; mag: number }>;
    severity: string;
    status?: string;
    meta?: { device_id: string };
  }>;
}

interface ApiHistoryResponse {
  ok: boolean;
  count: number;
  limit: number;
  bridge_id: string;
  items: ApiHistoryItem[];
}
```

### 2. Atualizar getHistoryByBridge

A função atual mapeia incorretamente. Nova implementação:

```typescript
export async function getHistoryByBridge(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TelemetryData[]> {
  const response = await api.get<ApiHistoryResponse>(`/telemetry/history/bridge/${bridgeId}`, { params });
  const data = response.data;
  
  if (!data?.items) return [];
  
  // Processar cada device e extrair último valor de freq/accel
  return data.items.map(item => {
    // Determinar modo de operação baseado em qual array tem dados recentes
    const hasRecentFreq = item.freq && item.freq.length > 0;
    const hasRecentAccel = item.accel && item.accel.length > 0;
    
    // Pegar última leitura de cada tipo
    const lastFreq = hasRecentFreq ? item.freq[item.freq.length - 1] : null;
    const lastAccel = hasRecentAccel ? item.accel[item.accel.length - 1] : null;
    
    // Determinar qual é o mais recente para usar como "último valor"
    const freqTime = lastFreq ? new Date(lastFreq.ts).getTime() : 0;
    const accelTime = lastAccel ? new Date(lastAccel.ts).getTime() : 0;
    const isFrequencyMode = freqTime > accelTime;
    
    return {
      deviceId: item.device_id,
      bridgeId: bridgeId,
      timestamp: isFrequencyMode ? lastFreq?.ts : lastAccel?.ts,
      modoOperacao: isFrequencyMode ? 'frequencia' : 'aceleracao',
      frequency: lastFreq?.peaks?.[0]?.f,
      acceleration: lastAccel?.value !== undefined 
        ? { x: 0, y: 0, z: lastAccel.value } 
        : undefined,
      status: isFrequencyMode ? lastFreq?.severity : lastAccel?.severity,
    };
  });
}
```

### 3. Nova Função para Pegar Último Valor por Device

```typescript
export function getLatestFromHistory(items: ApiHistoryItem[]): TelemetryData[] {
  return items.map(item => {
    // Pegar última leitura de freq e accel
    const lastFreq = item.freq?.length > 0 ? item.freq[item.freq.length - 1] : null;
    const lastAccel = item.accel?.length > 0 ? item.accel[item.accel.length - 1] : null;
    
    // Determinar qual é mais recente
    const freqTs = lastFreq ? new Date(lastFreq.ts).getTime() : 0;
    const accelTs = lastAccel ? new Date(lastAccel.ts).getTime() : 0;
    
    const isFrequencyLatest = freqTs > accelTs;
    
    return {
      deviceId: item.device_id,
      timestamp: isFrequencyLatest ? lastFreq?.ts : lastAccel?.ts,
      modoOperacao: isFrequencyLatest ? 'frequencia' : 'aceleracao',
      frequency: lastFreq?.peaks?.[0]?.f,
      acceleration: lastAccel ? { x: 0, y: 0, z: lastAccel.value } : undefined,
      status: isFrequencyLatest ? lastFreq?.severity : lastAccel?.severity,
    };
  });
}
```

### 4. Atualizar BridgeCard para Usar History

```typescript
// Em vez de usar latestData (que retorna null)
// Usar historyData que contém os valores reais

const { historyData, isLoading } = useTelemetry(bridge.id);

const sensorReadings = useMemo(() => {
  if (!historyData || historyData.length === 0) return [];
  
  return historyData.map((telemetry, idx) => {
    const isFrequency = telemetry.modoOperacao === 'frequencia';
    const value = isFrequency ? telemetry.frequency : telemetry.acceleration?.z;
    
    // ... resto do código existente
  });
}, [historyData]);
```

### 5. Combinar Latest (para modo_operacao) com History (para valores)

A solução mais robusta é:
1. Usar `/telemetry/latest` para obter `modo_operacao` atual de cada device
2. Usar `/telemetry/history` para obter os valores mais recentes

```typescript
export function useTelemetry(bridgeId?: string) {
  // ... queries existentes ...
  
  // Combinar dados: modo_operacao do latest + valores do history
  const combinedData = useMemo(() => {
    if (!latestQuery.data?.length || !historyQuery.data?.length) {
      return historyQuery.data || [];
    }
    
    const modeByDevice = new Map(
      latestQuery.data.map(d => [d.deviceId, d.modoOperacao])
    );
    
    return historyQuery.data.map(h => ({
      ...h,
      modoOperacao: modeByDevice.get(h.deviceId) || h.modoOperacao,
    }));
  }, [latestQuery.data, historyQuery.data]);
  
  return {
    latestData: combinedData,
    // ...
  };
}
```

---

## Estrutura de Dados do History

Cada item no array `items`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `device_id` | string | ID do dispositivo |
| `accel` | array | Lista de leituras de aceleração |
| `accel[n].value` | number | Valor da aceleração em m/s² |
| `accel[n].ts` | string | Timestamp da leitura |
| `accel[n].severity` | string | "normal", "warning", "critical" |
| `freq` | array | Lista de leituras de frequência |
| `freq[n].peaks` | array | Picos de frequência detectados |
| `freq[n].peaks[0].f` | number | Frequência principal em Hz |
| `freq[n].ts` | string | Timestamp da leitura |
| `freq[n].severity` | string | Status do alerta |

---

## Fluxo de Dados Corrigido

```text
1. Buscar /telemetry/latest/bridge/{id}
   → Obter modo_operacao de cada device
   → accel/freq são null

2. Buscar /telemetry/history/bridge/{id}
   → Obter arrays de leituras por device
   → Extrair último valor de freq[].peaks[0].f ou accel[].value

3. Combinar dados:
   → modo_operacao do latest
   → valores do history

4. Exibir na UI:
   → Tipo correto (Frequência/Aceleração)
   → Valor real (3.55 Hz, 9.84 m/s²)
   → Timestamp da última leitura
```

---

## Resultado Esperado

| Device | Modo | Último Freq | Último Accel | Exibição |
|--------|------|-------------|--------------|----------|
| S01 | frequencia | 3.55 Hz | 9.86 m/s² | `3.55 Hz` (mais recente) |
| S02 | aceleracao | - | 9.84 m/s² | `9.84 m/s²` |
| S03 | frequencia | 3.56 Hz | - | `3.56 Hz` |
| S04 | frequencia | 3.55 Hz | - | `3.55 Hz` |
| S05 | frequencia | 4.00 Hz | - | `4.00 Hz` |

---

## Estimativa

- **Tempo:** ~30 minutos
- **Arquivos:** 4-5 arquivos
- **Complexidade:** Média
