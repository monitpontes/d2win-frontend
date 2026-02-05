

# Plano: Corrigir Gráficos de Últimas Leituras

## Problemas Identificados

### 1. Comportamento "Sliding Window" não funciona corretamente

O `timeSeriesData` no hook `useTelemetry` está acumulando pontos de forma inconsistente. Quando um novo dado do WebSocket chega, ele é convertido para `TelemetryTimeSeriesPoint` e adicionado ao array, mas:
- O `realtimeData` do WebSocket **substitui** o dado anterior do mesmo `deviceId` ao invés de **acumular** cada leitura como ponto separado
- O gráfico deveria mostrar o histórico deslizando para a esquerda conforme novos dados chegam

### 2. Gráfico de frequência mostra apenas 1 pico

Atualmente, `TelemetryTimeSeriesPoint` só armazena um `value`. Para frequência, precisa armazenar `peak1` e `peak2`.

---

## Solução

### Parte 1: Corrigir acúmulo de dados para sliding window

**Arquivo: `src/hooks/useTelemetrySocket.ts`**

Modificar para **acumular** cada leitura como ponto separado no tempo:

```typescript
// Estado acumulativo para séries temporais
const [timeSeriesHistory, setTimeSeriesHistory] = useState<{
  deviceId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  peak2?: number; // Segundo pico de frequência
}[]>([]);

// Ao receber telemetry, adicionar novo ponto (não substituir)
setTimeSeriesHistory(prev => {
  const newPoint = {
    deviceId: event.device_id,
    timestamp: event.ts,
    type: event.type === 'freq' ? 'frequency' : 'acceleration',
    value: event.type === 'freq' ? peaks[0]?.f : event.payload.value,
    peak2: event.type === 'freq' ? peaks[1]?.f : undefined,
  };
  // Manter últimos 50 pontos por device para evitar crescimento infinito
  const devicePoints = prev.filter(p => p.deviceId === newPoint.deviceId);
  const otherPoints = prev.filter(p => p.deviceId !== newPoint.deviceId);
  return [...otherPoints, ...devicePoints.slice(-49), newPoint];
});
```

### Parte 2: Adicionar dois picos no gráfico de frequência

**Arquivo: `src/pages/BridgeDetail.tsx`**

Modificar o gráfico de frequência para renderizar 2 linhas (Pico 1 e Pico 2):

```tsx
{currentSelectedSensor.deviceType === 'frequencia' ? (
  <LineChart data={...}>
    {/* Pico 1 */}
    <Line 
      type="monotone" 
      dataKey="peak1" 
      stroke="hsl(var(--primary))" 
      name="Pico 1"
    />
    {/* Pico 2 */}
    <Line 
      type="monotone" 
      dataKey="peak2" 
      stroke="hsl(var(--chart-2))" 
      name="Pico 2"
    />
  </LineChart>
) : (
  // Gráfico de aceleração (mantém como está)
  <LineChart data={...}>
    <Line dataKey="value" ... />
  </LineChart>
)}
```

---

## Alterações Detalhadas

### Arquivo 1: `src/hooks/useTelemetrySocket.ts`

| Modificação | Descrição |
|-------------|-----------|
| Novo estado `timeSeriesHistory` | Array que acumula cada leitura como ponto separado |
| Modificar `handleTelemetry` | Adicionar novo ponto ao `timeSeriesHistory` (não substituir) |
| Limitar a 50 pontos por device | Evitar crescimento infinito de memória |
| Retornar `timeSeriesHistory` | Exportar para uso nos gráficos |

### Arquivo 2: `src/lib/api/telemetry.ts`

| Modificação | Descrição |
|-------------|-----------|
| Modificar `TelemetryTimeSeriesPoint` | Adicionar campos `peak1` e `peak2` para frequência |
| Modificar `getHistoryTimeSeries` | Extrair ambos os picos de frequência |

### Arquivo 3: `src/hooks/useTelemetry.ts`

| Modificação | Descrição |
|-------------|-----------|
| Consumir `timeSeriesHistory` do socket | Combinar histórico inicial + novos pontos do WebSocket |
| Manter sliding window de 50 pontos por device | Para que `.slice(-8)` funcione corretamente |

### Arquivo 4: `src/pages/BridgeDetail.tsx`

| Modificação | Descrição |
|-------------|-----------|
| Separar gráficos por tipo | Frequência: 2 linhas (Pico 1, Pico 2). Aceleração: 1 linha |
| Mapear `peak1` e `peak2` | Nos dados do gráfico de frequência |
| Adicionar `Legend` | Mostrar legenda com cores diferentes para cada pico |

---

## Fluxo de Dados Atualizado

```
WebSocket Event (freq)
  ↓
useTelemetrySocket
  - realtimeData: substitui último valor (para cards)
  - timeSeriesHistory: acumula pontos (para gráficos)
  ↓
useTelemetry
  - Combina API inicial + timeSeriesHistory
  - Mantém últimos 50 pontos por device
  ↓
BridgeDetail
  - Filtra por deviceId selecionado
  - Pega últimos 8 pontos
  - Renderiza gráfico com 1 ou 2 linhas
```

---

## Resultado Esperado

- Gráfico mostra **exatamente 8 leituras** mais recentes
- Quando chega um dado novo, os anteriores **deslizam para a esquerda**
- Gráfico de **frequência mostra 2 linhas** (Pico 1 em azul, Pico 2 em outra cor)
- Gráfico de **aceleração mantém 1 linha** (valor Z)

