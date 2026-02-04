
# Plano: Corrigir Exibição de Valores e Atualização em Tempo Real

## Problemas Identificados

### Problema 1: WebSocket não extrai magnitude e segundo pico
O `useTelemetrySocket.ts` só extrai `peaks[0].f` (frequência do primeiro pico), mas ignora:
- `peaks[0].mag` (magnitude do pico 1)
- `peaks[1].f` (frequência do pico 2)
- `peaks[1].mag` (magnitude do pico 2)

**Prova nos logs do console:**
```json
{
  "type": "freq",
  "device_id": "Motiva_P1_S03",
  "payload": {
    "peaks": [
      { "f": 3.527832, "mag": 359.7332792 },  // ← magnitude1 ignorada!
      { "f": 3.564453, "mag": 315.9170741 }   // ← pico 2 inteiro ignorado!
    ]
  }
}
```

### Problema 2: Painel não atualiza em tempo real
Quando o usuário clica em um sensor, `selectedSensor3D` fica estático (um snapshot). Os dados do WebSocket atualizam `bridge3DSensors`, mas o painel continua mostrando os valores antigos.

## Solução

### 1. Atualizar `useTelemetrySocket.ts` para extrair todos os campos

Modificar o mapeamento do evento WebSocket para incluir todos os dados:

```typescript
const mapped: TelemetryData = {
  deviceId: event.device_id,
  bridgeId: event.bridge_id,
  timestamp: event.ts,
  modoOperacao: event.type === "freq" ? "frequencia" : "aceleracao",
  status: event.payload.severity,
  // Extrair TODOS os peaks
  frequency: event.type === "freq" ? event.payload.peaks?.[0]?.f : undefined,
  magnitude1: event.type === "freq" ? event.payload.peaks?.[0]?.mag : undefined,
  frequency2: event.type === "freq" ? event.payload.peaks?.[1]?.f : undefined,
  magnitude2: event.type === "freq" ? event.payload.peaks?.[1]?.mag : undefined,
  // Aceleração
  acceleration: event.type === "accel" && event.payload.value !== undefined
    ? { x: 0, y: 0, z: event.payload.value }
    : undefined,
};
```

### 2. Atualizar painel para sincronizar com dados em tempo real

No `BridgeDetail.tsx`, criar um `useMemo` que mantém o `selectedSensor3D` sincronizado com os dados mais recentes:

```typescript
// Sincronizar sensor selecionado com dados atualizados
const currentSelectedSensor = useMemo(() => {
  if (!selectedSensor3D) return null;
  
  // Buscar versão atualizada do sensor em bridge3DSensors
  const updated = bridge3DSensors.find(s => s.id === selectedSensor3D.id);
  return updated || selectedSensor3D;
}, [selectedSensor3D, bridge3DSensors]);
```

E usar `currentSelectedSensor` no painel em vez de `selectedSensor3D`.

## Fluxo Corrigido

```text
WebSocket recebe evento freq
    │
    ▼
useTelemetrySocket mapeia TODOS os campos:
- frequency, magnitude1, frequency2, magnitude2
    │
    ▼
useTelemetry.combinedData atualiza com realtimeData
    │
    ▼
bridge3DSensors recalcula (useMemo)
    │
    ▼
currentSelectedSensor sincroniza automaticamente
    │
    ▼
Painel exibe valores atualizados em tempo real
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTelemetrySocket.ts` | Extrair magnitude1, magnitude2, frequency2 do payload |
| `src/pages/BridgeDetail.tsx` | Criar `currentSelectedSensor` para sincronizar painel em tempo real |

## Resultado Esperado

- **Frequência Pico 1**: `3.52 Hz` (valor real atualizado via WebSocket)
- **Magnitude Pico 1**: `359.73` (valor real)
- **Frequência Pico 2**: `3.56 Hz` (valor real)
- **Magnitude Pico 2**: `315.92` (valor real)
- **Atualização automática**: Valores mudam em tempo real sem precisar clicar novamente
