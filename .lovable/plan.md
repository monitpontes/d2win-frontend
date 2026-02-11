

# Corrigir grafico de frequencia: ultimos 10 pontos POR sensor

## Problema

O codigo atual agrupa todos os dados de todos os sensores por timestamp compartilhado. Como cada sensor envia dados em horarios diferentes, cada linha do `timeMap` acaba tendo valor de apenas 1 sensor. O `.slice(-10)` pega os ultimos 10 timestamps globais, que pertencem a poucos sensores, deixando os outros sem dados visiveis.

## Solucao

Mudar a logica para pegar os **ultimos 10 pontos de CADA sensor** individualmente, e depois unir todos os timestamps num eixo de tempo completo. Isso significa que o eixo X pode ter mais de 10 horarios, mas cada sensor tera suas 10 leituras mais recentes.

### Arquivo: `src/components/dashboard/BridgeCard.tsx` (linhas 159-187)

Nova logica do `buildSensorChart`:

```typescript
const buildSensorChart = (type: 'frequency' | 'acceleration') => {
  const excludedDeviceIds = new Set(
    devices.filter(d => d.type === 'command_box').map(d => d.deviceId)
  );
  const filtered = timeSeriesData.filter(d => 
    d.type === type && !excludedDeviceIds.has(d.deviceId)
  );
  const sensorIds = [...new Set(filtered.map(d => d.deviceId))];
  
  // 1. Agrupar dados por sensor
  const sensorDataMap = new Map<string, typeof filtered>();
  filtered.forEach(d => {
    if (!sensorDataMap.has(d.deviceId)) sensorDataMap.set(d.deviceId, []);
    sensorDataMap.get(d.deviceId)!.push(d);
  });
  
  // 2. Para cada sensor, pegar os ultimos 10 pontos
  const allTimestamps = new Set<string>();
  const sensorLabelsMap = new Map<string, string>();
  
  sensorDataMap.forEach((points, deviceId) => {
    const device = devices.find(dev => dev.deviceId === deviceId);
    const label = device?.name || deviceId?.slice(-4) || 'Sensor';
    sensorLabelsMap.set(deviceId, label);
    
    // Ordenar por timestamp e pegar ultimos 10
    const sorted = [...points].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const last10 = sorted.slice(-10);
    last10.forEach(d => {
      allTimestamps.add(formatDateValue(d.timestamp, 'HH:mm:ss'));
    });
  });
  
  // 3. Criar timeline ordenada com TODOS os timestamps
  const sortedTimes = [...allTimestamps].sort();
  const timeMap = new Map<string, Record<string, number | string>>();
  sortedTimes.forEach(time => timeMap.set(time, { time }));
  
  // 4. Preencher valores de cada sensor nos timestamps correspondentes
  sensorDataMap.forEach((points, deviceId) => {
    const label = sensorLabelsMap.get(deviceId)!;
    const sorted = [...points].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    sorted.slice(-10).forEach(d => {
      const time = formatDateValue(d.timestamp, 'HH:mm:ss');
      const row = timeMap.get(time);
      if (row) row[label] = d.value;
    });
  });
  
  const data = Array.from(timeMap.values());
  const sensorLabels = [...sensorLabelsMap.values()];
  
  // 5. So manter sensores com >= 1 valor
  const activeSensorLabels = sensorLabels.filter(label =>
    data.some(row => row[label] !== undefined && row[label] !== null)
  );
  
  return { data, sensorIds: activeSensorLabels };
};
```

### Diferenca principal

| Antes | Depois |
|-------|--------|
| Agrupa todos os sensores por timestamp compartilhado | Pega ultimos 10 pontos de CADA sensor |
| `.slice(-10)` no total de timestamps | Cada sensor contribui seus proprios 10 timestamps |
| Eixo X: 10 horarios | Eixo X: todos os horarios necessarios |
| Sensores sem dados no janela aparecem vazios | Cada sensor tem suas 10 leituras garantidas |

Nenhuma outra mudanca necessaria -- altura e legenda ja estao corretas.

