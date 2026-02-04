
# Plano: Corrigir Match entre Devices e Telemetria

## Problema Identificado

O match entre devices e telemetria está falhando porque:

| Sistema | Campo Usado | Valor |
|---------|-------------|-------|
| Devices (atual) | `id` = `_id` | `68c8507fca1f72aed1c22fcf` |
| Telemetria | `deviceId` = `device_id` | `"Motiva_P1_S01"` |

A comparação `latestData.find(t => t.deviceId === device.id)` nunca encontra match porque compara ObjectId com string nome.

## Estrutura Real do Banco (conforme imagens)

**Devices:**
```json
{
  "_id": ObjectId("68c8507fca1f72aed1c22fcf"),
  "device_id": "Motiva_P1_S03",  // <-- Usado para match
  "name": "Motiva_P1_S03",       // <-- Exibição
  "bridge_id": ObjectId("..."),
  "modo_operacao": "frequencia"
}
```

**Telemetria:**
```json
{
  "device_id": "Motiva_P1_S01",  // <-- Match via este campo
  "peaks": [...],
  "status": "atividade_detectada"
}
```

---

## Solução

### 1. Atualizar Interface ApiDevice

Adicionar campo `device_id` que é o identificador string usado pela telemetria:

```typescript
// src/lib/api/devices.ts
export interface ApiDevice {
  _id: string;
  device_id: string;  // NOVO: "Motiva_P1_S03"
  bridge_id: string;
  company_id: string;
  type: SensorType;
  name: string;
  // ...
}
```

### 2. Atualizar Interface Sensor

Adicionar campo `deviceId` para guardar o identificador string:

```typescript
// src/types/index.ts
export interface Sensor {
  id: string;        // ObjectId do MongoDB
  deviceId: string;  // NOVO: "Motiva_P1_S03" para match com telemetria
  bridgeId: string;
  name: string;
  // ...
}
```

### 3. Atualizar Mapeamento

```typescript
// src/lib/api/devices.ts
export function mapApiDeviceToSensor(apiDevice: ApiDevice): Sensor {
  return {
    id: apiDevice._id,
    deviceId: apiDevice.device_id || apiDevice.name,  // NOVO
    bridgeId: apiDevice.bridge_id,
    name: apiDevice.name || apiDevice.device_id,
    // ...
  };
}
```

### 4. Corrigir Match no BridgeCard

```typescript
// src/components/dashboard/BridgeCard.tsx
const sensorReadings = useMemo(() => {
  return devices.map(device => {
    // Match usando deviceId (string) ao invés de id (ObjectId)
    const telemetry = latestData.find(t => t.deviceId === device.deviceId);
    // ...
  });
}, [devices, latestData]);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/index.ts` | Adicionar `deviceId` na interface `Sensor` |
| `src/lib/api/devices.ts` | Adicionar `device_id` na interface e mapeamento |
| `src/components/dashboard/BridgeCard.tsx` | Usar `device.deviceId` para match |

---

## Fluxo Corrigido

```text
1. useDevices retorna:
   { id: "68c...", deviceId: "Motiva_P1_S01", name: "Motiva_P1_S01" }

2. useTelemetry retorna:
   { deviceId: "Motiva_P1_S01", frequency: 3.50 }

3. Match:
   latestData.find(t => t.deviceId === device.deviceId)
   // "Motiva_P1_S01" === "Motiva_P1_S01" ✓
```

---

## Código do Match Corrigido

```typescript
// BridgeCard.tsx - dentro de sensorReadings useMemo
if (devices.length > 0) {
  return devices.map(device => {
    // Match usando deviceId (string nome) ao invés de id (ObjectId)
    const telemetry = latestData.find(t => 
      t.deviceId === device.deviceId || t.deviceId === device.name
    );
    
    return processReading(
      device.deviceId,      // Usar deviceId para identificação
      device.name,          // Nome para exibição
      telemetry,
      device.type
    );
  });
}
```
