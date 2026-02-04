
# Plano: Corrigir Painel de Sensor com Picos Reais e Gráfico do Histórico

## Problemas Identificados

| Problema | Atual | Esperado |
|----------|-------|----------|
| Nome do sensor | `68b9e38a...-Motiva_P1_S01` (bridge.id + deviceId) | `Motiva_P1_S01` (do banco) |
| Posição | `Posição Motiva_P1_S01` (gerado) | `Viga 1` (do banco - campo position ou name) |
| Frequência Pico 1/2 | Só mostra Pico 1 (ou vazio) | Mostrar ambos peaks[0] e peaks[1] |
| Magnitude Pico 1/2 | Calculada (freq * 5.5) | Valor real peaks[0].mag e peaks[1].mag |
| Gráfico | Dados mockados (Math.random) | Dados reais do `timeSeriesData` |

## Estrutura da API de Telemetria

```typescript
// API retorna múltiplos picos:
freq: {
  peaks: [
    { f: 3.52, mag: 1019.72 },  // Pico 1
    { f: 3.59, mag: 901.05 }    // Pico 2
  ],
  ts: "2026-02-04T19:24:08.545Z"
}
```

Atualmente só `peaks[0].f` é extraído, ignorando `peaks[1]` e todas as magnitudes.

---

## Alterações Necessárias

### 1. Expandir Interface TelemetryData

Adicionar campos para os dois picos com suas magnitudes:

```typescript
// src/lib/api/telemetry.ts
export interface TelemetryData {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  frequency?: number;           // Pico 1 frequência (compatibilidade)
  frequency2?: number;          // NOVO: Pico 2 frequência
  magnitude1?: number;          // NOVO: Pico 1 magnitude
  magnitude2?: number;          // NOVO: Pico 2 magnitude
  acceleration?: { x: number; y: number; z: number };
  modoOperacao?: string;
  status?: string;
}
```

### 2. Atualizar Mapeamento da API

Extrair os dois picos com magnitudes:

```typescript
// src/lib/api/telemetry.ts - mapApiDeviceToTelemetry
function mapApiDeviceToTelemetry(device: ApiDeviceTelemetry, bridgeId: string): TelemetryData {
  const isFrequency = device.modo_operacao === 'frequencia';
  const peaks = device.freq?.peaks || [];
  
  return {
    deviceId: device.device_id,
    bridgeId: bridgeId,
    timestamp: device.last_seen,
    modoOperacao: device.modo_operacao,
    status: device.status,
    // Pico 1
    frequency: peaks[0]?.f,
    magnitude1: peaks[0]?.mag,
    // Pico 2
    frequency2: peaks[1]?.f,
    magnitude2: peaks[1]?.mag,
    // Aceleração
    acceleration: !isFrequency && device.accel?.value !== undefined
      ? { x: 0, y: 0, z: device.accel.value }
      : undefined,
  };
}
```

### 3. Atualizar Interface Bridge3DSensor

```typescript
// src/components/bridge/Bridge3D.tsx
export type Bridge3DSensor = {
  id: string;
  name: string;
  position: string;
  type: "Frequência" | "Aceleração" | "Comando";
  deviceType: "frequencia" | "aceleracao" | "caixa_comando";
  status: "normal" | "warning" | "critical" | "inactive" | "alert" | "alerta" | "critica";
  frequency1?: number;
  magnitude1?: number;   // NOVO
  frequency2?: number;
  magnitude2?: number;   // NOVO
  acceleration?: number;
  timestamp?: string;
};
```

### 4. Cruzar com Dados do Banco (sensors) no BridgeDetail

Usar os dados do banco para nome e posição, e telemetria para valores:

```typescript
// src/pages/BridgeDetail.tsx - bridge3DSensors useMemo
const bridge3DSensors: Bridge3DSensor[] = useMemo(() => {
  // Criar mapa de telemetria por deviceId
  const telemetryByDevice = new Map(
    telemetryData.map(t => [t.deviceId, t])
  );

  // Base: sensores do banco (nome, posição) + telemetria (valores)
  if (sensors.length > 0) {
    return sensors.map((sensor, idx) => {
      const telemetry = telemetryByDevice.get(sensor.deviceId) || 
                        telemetryByDevice.get(sensor.name);
      
      const isFrequency = sensor.type === 'frequency' || 
                          telemetry?.modoOperacao === 'frequencia';
      
      return {
        id: sensor.deviceId || sensor.name,
        name: sensor.name,  // Nome do banco
        position: `Viga ${idx + 1}`,  // Ou usar sensor.position se existir
        type: isFrequency ? 'Frequência' : 'Aceleração',
        deviceType: isFrequency ? 'frequencia' : 'aceleracao',
        status: mapStatus(telemetry?.status),
        frequency1: telemetry?.frequency,
        magnitude1: telemetry?.magnitude1,
        frequency2: telemetry?.frequency2,
        magnitude2: telemetry?.magnitude2,
        acceleration: telemetry?.acceleration?.z,
        timestamp: telemetry?.timestamp,
      };
    });
  }
  // Fallback para telemetria direta se banco vazio
  // ...
}, [sensors, telemetryData]);
```

### 5. Atualizar Display do Painel de Sensor

Mostrar valores reais dos picos:

```tsx
// src/pages/BridgeDetail.tsx - painel de sensor selecionado
{selectedSensor3D.deviceType === 'frequencia' && (
  <>
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-muted-foreground text-sm">Frequência Pico 1:</span>
      <span className="font-bold text-sm">
        {selectedSensor3D.frequency1?.toFixed(2) || '-'} Hz
      </span>
    </div>
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-muted-foreground text-sm">Magnitude Pico 1:</span>
      <span className="font-medium text-sm">
        {selectedSensor3D.magnitude1?.toFixed(2) || '-'}
      </span>
    </div>
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-muted-foreground text-sm">Frequência Pico 2:</span>
      <span className="font-bold text-sm">
        {selectedSensor3D.frequency2?.toFixed(2) || '-'} Hz
      </span>
    </div>
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-muted-foreground text-sm">Magnitude Pico 2:</span>
      <span className="font-medium text-sm">
        {selectedSensor3D.magnitude2?.toFixed(2) || '-'}
      </span>
    </div>
  </>
)}
```

### 6. Usar Dados Reais no Gráfico

Substituir dados mockados pelo `timeSeriesData` real:

```tsx
// src/pages/BridgeDetail.tsx - gráfico do sensor
// Buscar timeSeriesData do useTelemetry
const { latestData: telemetryData, timeSeriesData, isLoading } = useTelemetry(id);

// Filtrar dados do sensor selecionado
const sensorChartData = useMemo(() => {
  if (!selectedSensor3D || !timeSeriesData) return [];
  
  return timeSeriesData
    .filter(point => point.deviceId === selectedSensor3D.id)
    .slice(-8)  // Últimas 8 leituras
    .map(point => ({
      time: format(new Date(point.timestamp), 'HH:mm:ss'),
      value: point.value,
      type: point.type,
    }));
}, [selectedSensor3D, timeSeriesData]);

// Usar sensorChartData no LineChart
<LineChart data={sensorChartData}>
  ...
</LineChart>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/telemetry.ts` | Adicionar campos frequency2, magnitude1, magnitude2 na interface e mapeamento |
| `src/components/bridge/Bridge3D.tsx` | Adicionar magnitude1/2 na interface Bridge3DSensor |
| `src/pages/BridgeDetail.tsx` | Cruzar sensors com telemetry, usar nome do banco, mostrar picos reais, usar timeSeriesData |

---

## Fluxo de Dados Corrigido

```text
1. useDevices(bridgeId)
   → sensors: [{ deviceId: "Motiva_P1_S01", name: "Motiva_P1_S01", position: {...} }]

2. useTelemetry(bridgeId)
   → latestData: [{ deviceId: "Motiva_P1_S01", frequency: 3.52, magnitude1: 1019, frequency2: 3.59, magnitude2: 901 }]
   → timeSeriesData: [{ deviceId: "Motiva_P1_S01", timestamp, value, type }...]

3. bridge3DSensors = sensors.map(s => {
     telemetry = latestData.find(t => t.deviceId === s.deviceId);
     return { 
       name: s.name,           // "Motiva_P1_S01" do banco
       frequency1: telemetry.frequency,
       magnitude1: telemetry.magnitude1,
       ...
     }
   })

4. Gráfico: timeSeriesData.filter(p => p.deviceId === sensor.id).slice(-8)
```

---

## Resultado Esperado

- **Nome**: `Motiva_P1_S01` (do banco, sem o ID da ponte)
- **Posição**: `Viga 1` (baseado na ordem ou campo do banco)
- **Frequência Pico 1**: `3.52 Hz` (valor real)
- **Magnitude Pico 1**: `1019.72` (valor real)
- **Frequência Pico 2**: `3.59 Hz` (valor real)
- **Magnitude Pico 2**: `901.05` (valor real)
- **Gráfico**: Série temporal real dos últimos 8 pontos do sensor
