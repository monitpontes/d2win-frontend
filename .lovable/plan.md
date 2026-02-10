

# Corrigir grafico de frequencia: mostrar todos os sensores com dados

## Problema raiz

O filtro atual na linha 161-163 busca `devices.filter(d => d.type === type)` para criar a lista de dispositivos validos. Se um sensor produz dados de frequencia na telemetria mas esta configurado como outro tipo no banco (ou nao esta na lista de devices), ele e excluido do grafico. Isso faz com que apenas alguns sensores aparecam.

## Solucao

Trocar a logica de "incluir apenas sensores do tipo X" para "excluir apenas sensores command_box". Sensores command_box nao produzem dados de frequencia/aceleracao, entao sao os unicos que devem ser removidos. Todos os demais que tenham dados de telemetria do tipo correto devem aparecer.

### Arquivo: `src/components/dashboard/BridgeCard.tsx` (linhas 159-167)

Antes:
```typescript
const validDeviceIds = new Set(
  devices.filter(d => d.type === type).map(d => d.deviceId)
);
const filtered = timeSeriesData.filter(d => 
  d.type === type && (validDeviceIds.size === 0 || validDeviceIds.has(d.deviceId))
);
```

Depois:
```typescript
// Excluir apenas command_box (nao produzem freq/accel)
const excludedDeviceIds = new Set(
  devices.filter(d => d.type === 'command_box').map(d => d.deviceId)
);
// Filtrar pela telemetria (d.type) e excluir command_box
const filtered = timeSeriesData.filter(d => 
  d.type === type && !excludedDeviceIds.has(d.deviceId)
);
```

Isso garante que qualquer sensor que produza dados de frequencia na API aparecera no grafico de frequencia, e qualquer sensor que produza dados de aceleracao aparecera no grafico de aceleracao -- independentemente do tipo configurado no banco. Apenas sensores `command_box` sao explicitamente excluidos.

O restante da logica (agrupar por timestamp, filtrar legenda por dados existentes, altura 160px) permanece inalterado.

