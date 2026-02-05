

# Plano: Exibir Ultimo Valor do /latest Baseado na Configuracao do Sensor

## Resumo do Problema

1. O endpoint `/telemetry/latest` retorna AMBOS os dados (`freq` e `accel`) para cada sensor
2. A funcao `mapApiDeviceToTelemetry` so extrai aceleracao quando `modo_operacao !== 'frequencia'`
3. Isso causa valores "-" quando o sensor tem dados mas o modo nao bate

## Solucao

### Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────┐
│               PRIMEIRA CARGA DA PAGINA                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GET /telemetry/latest/bridge/{id}                          │
│                                                             │
│  Retorna para cada sensor:                                  │
│    - freq: { peaks: [{f: 3.54, mag: 1433}] }               │
│    - accel: { value: 9.90 }                                 │
│    - modo_operacao: "frequencia" ou "aceleracao"            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  mapApiDeviceToTelemetry (CORRIGIR)                         │
│                                                             │
│  ANTES: so extrai accel se !isFrequency                     │
│  DEPOIS: extrai AMBOS sempre                                │
│                                                             │
│  frequency: peaks[0]?.f        → 3.54                       │
│  acceleration: accel?.value    → 9.90                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  BridgeCard.processReading (JA CORRETO)                     │
│                                                             │
│  Usa deviceType do banco para decidir qual exibir:          │
│    - deviceType = 'frequency' → mostra telemetry.frequency  │
│    - deviceType = 'acceleration' → mostra telemetry.accel.z │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  WebSocket assume para atualizacoes em tempo real           │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

### 1. src/lib/api/telemetry.ts

**Funcao:** `mapApiDeviceToTelemetry` (linhas 76-96)

**Mudanca:** Remover condicao `!isFrequency` da extracao de aceleracao

| Linha | Antes | Depois |
|-------|-------|--------|
| 77 | `const isFrequency = device.modo_operacao === 'frequencia';` | Remover (nao precisa mais) |
| 92-94 | `acceleration: !isFrequency && device.accel?.value !== undefined` | `acceleration: device.accel?.value !== undefined` |

**Codigo corrigido:**

```typescript
function mapApiDeviceToTelemetry(device: ApiDeviceTelemetry, bridgeId: string): TelemetryData {
  const peaks = device.freq?.peaks || [];
  
  return {
    deviceId: device.device_id,
    bridgeId: bridgeId,
    timestamp: device.last_seen,
    modoOperacao: device.modo_operacao,
    status: device.status,
    // SEMPRE extrair frequencia (primeiro pico)
    frequency: peaks[0]?.f,
    magnitude1: peaks[0]?.mag,
    frequency2: peaks[1]?.f,
    magnitude2: peaks[1]?.mag,
    // SEMPRE extrair aceleracao (sem condicao)
    acceleration: device.accel?.value !== undefined
      ? { x: 0, y: 0, z: device.accel.value }
      : undefined,
  };
}
```

### 2. src/components/dashboard/BridgeCard.tsx

**Status:** Ja esta correto (linha 88)

```typescript
const isFrequency = deviceType === 'frequency' || telemetry?.modoOperacao === 'frequencia';
```

O `deviceType` vem do banco de dados (configuracao do sensor) e tem prioridade.

## Resultado Final

| Sensor | Configuracao (deviceType) | freq.peaks[0].f | accel.value | Valor Exibido |
|--------|---------------------------|-----------------|-------------|---------------|
| Motiva_P1_S01 | frequency | 3.54 | 9.90 | **3.54 Hz** |
| Motiva_P1_S02 | acceleration | 3.54 | 9.90 | **9.90 m/s²** |
| Motiva_P1_S03 | frequency | 3.24 | - | **3.24 Hz** |

## Resumo das Alteracoes

| Arquivo | O Que Muda |
|---------|------------|
| `src/lib/api/telemetry.ts` | Remover `!isFrequency &&` da linha 92 |
| `src/components/dashboard/BridgeCard.tsx` | Nenhuma (ja correto) |

## Sequencia de Eventos

1. **Pagina carrega** → GET `/telemetry/latest`
2. **mapApiDeviceToTelemetry** → Extrai AMBOS valores (freq + accel)
3. **BridgeCard** → Exibe valor baseado no `deviceType` do sensor
4. **WebSocket conecta** → Assume atualizacoes em tempo real
5. **Novo dado chega** → Atualiza apenas o sensor especifico

