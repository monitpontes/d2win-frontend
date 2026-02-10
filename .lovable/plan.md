
# Plano: Filtrar legenda por tipo + dados reais + aumentar altura dos graficos

## Problemas

1. A legenda mostra sensores que nao sao do tipo correto (ex: sensores de `command_box` aparecendo no grafico de frequencia)
2. Sensores sem dados nos ultimos 10 pontos aparecem na legenda mas sem linha visivel
3. No grafico de frequencia, nem todos os pontos de todos os sensores aparecem porque os dados nao estao sendo mapeados corretamente por timestamp
4. Altura dos graficos (120px) e pequena para visualizar multiplos sensores

## Solucao

### Arquivo: `src/components/dashboard/BridgeCard.tsx`

**Mudanca A: Filtrar sensores na legenda por tipo e por dados existentes**

Na funcao `buildSensorChart` (linhas 159-180), adicionar dois filtros:

1. Filtrar `timeSeriesData` apenas para sensores cujo `device.type` no banco corresponda ao tipo do grafico
2. Apos agrupar, remover sensores que nao tenham pelo menos 1 valor nos ultimos 10 pontos

```typescript
const buildSensorChart = (type: 'frequency' | 'acceleration') => {
  // 1. Obter deviceIds validos pelo tipo configurado no banco
  const validDeviceIds = new Set(
    devices
      .filter(d => d.type === type)
      .map(d => d.deviceId)
  );
  
  // 2. Filtrar telemetria por tipo E por dispositivos validos
  const filtered = timeSeriesData.filter(d => 
    d.type === type && (validDeviceIds.size === 0 || validDeviceIds.has(d.deviceId))
  );
  
  // 3. Agrupar por timestamp (logica existente)
  const sensorIds = [...new Set(filtered.map(d => d.deviceId))];
  const timeMap = new Map<string, Record<string, number | string>>();
  filtered.forEach(d => {
    const time = formatDateValue(d.timestamp, 'HH:mm:ss');
    if (!timeMap.has(time)) timeMap.set(time, { time });
    const row = timeMap.get(time)!;
    const device = devices.find(dev => dev.deviceId === d.deviceId);
    const label = device?.name || d.deviceId?.slice(-4) || 'Sensor';
    row[label] = d.value;
  });
  
  const sensorLabels = sensorIds.map(id => {
    const device = devices.find(dev => dev.deviceId === id);
    return device?.name || id?.slice(-4) || 'Sensor';
  });
  
  const data = Array.from(timeMap.values()).slice(-10);
  
  // 4. Filtrar labels: so manter sensores que tenham >= 1 valor nos dados finais
  const activeSensorLabels = sensorLabels.filter(label =>
    data.some(row => row[label] !== undefined && row[label] !== null)
  );
  
  return { data, sensorIds: activeSensorLabels };
};
```

**Mudanca B: Aumentar altura dos graficos**

Alterar de `h-[120px]` para `h-[160px]` nos dois containers de grafico (linhas 373 e 408).

## Resumo

| Local | Mudanca |
|-------|---------|
| BridgeCard.tsx L159-180 | Filtrar por `device.type` e por dados existentes nos ultimos 10 pontos |
| BridgeCard.tsx L373 | `h-[120px]` para `h-[160px]` (frequencia) |
| BridgeCard.tsx L408 | `h-[120px]` para `h-[160px]` (aceleracao) |
