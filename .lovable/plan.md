

# Plano: Foco no 3D ao abrir sensor + Filtrar legenda dos graficos

## 1. Scroll automatico para a Visualizacao 3D ao clicar num sensor

### Problema
Quando o usuario clica numa linha de sensor na tabela do dashboard, a pagina de detalhes abre mas nao foca na visualizacao 3D. O usuario precisa rolar manualmente para ver o sensor selecionado.

### Solucao
No `BridgeDetail.tsx`, ao detectar o query param `sensor`, alem de selecionar o sensor, rolar a pagina ate a secao de Visualizacao 3D usando `scrollIntoView`.

**Arquivo: `src/pages/BridgeDetail.tsx`**

- Adicionar um `ref` no container da Visualizacao 3D (ex: `view3DRef`)
- No `useEffect` que ja detecta o `sensor` param, apos selecionar o sensor, chamar `view3DRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`

```typescript
const view3DRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const sensorParam = searchParams.get('sensor');
  if (sensorParam && bridge3DSensors.length > 0 && !selectedSensor3D) {
    const found = bridge3DSensors.find(s => s.name === sensorParam || s.id === sensorParam);
    if (found) {
      setSelectedSensor3D(found);
      // Scroll para a secao 3D
      setTimeout(() => {
        view3DRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }
}, [bridge3DSensors, searchParams, selectedSensor3D]);
```

## 2. Filtrar legenda dos graficos - so sensores de frequencia e aceleracao

### Problema
Os graficos de frequencia e aceleracao mostram todos os sensores na legenda, incluindo sensores do tipo `command_box` que nao produzem dados de frequencia ou aceleracao. Isso polui a legenda com sensores irrelevantes.

### Solucao
No `BridgeCard.tsx`, ao construir o `chartData`, filtrar os `sensorIds` para incluir apenas sensores cujo `type` no banco de dados corresponda ao tipo do grafico:
- Grafico de Frequencia: so sensores com `device.type === 'frequency'`
- Grafico de Aceleracao: so sensores com `device.type === 'acceleration'`

**Arquivo: `src/components/dashboard/BridgeCard.tsx`**

Modificar a funcao `buildSensorChart` dentro do `useMemo` de `chartData`:

```typescript
const buildSensorChart = (type: 'frequency' | 'acceleration') => {
  // Filtrar dispositivos pelo tipo registrado no banco
  const validDeviceIds = new Set(
    devices
      .filter(d => d.type === type)
      .map(d => d.deviceId)
  );
  
  // Filtrar dados de telemetria apenas para sensores validos
  const filtered = timeSeriesData.filter(d => 
    d.type === type && (validDeviceIds.size === 0 || validDeviceIds.has(d.deviceId))
  );
  
  const sensorIds = [...new Set(filtered.map(d => d.deviceId))];
  // ... resto da logica (timeMap, labels) permanece igual
};
```

Isso garante que:
- Sensores `command_box` nao aparecem em nenhum grafico
- Sensores `frequency` so aparecem no grafico de Frequencia
- Sensores `acceleration` so aparecem no grafico de Aceleracao

## Resumo dos Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/BridgeDetail.tsx` | Adicionar ref + scrollIntoView na secao 3D ao detectar sensor param |
| `src/components/dashboard/BridgeCard.tsx` | Filtrar sensorIds no chartData pelo tipo do dispositivo no banco |

## Secao Tecnica

O filtro da legenda usa o campo `device.type` que vem do banco de dados (via `useDevices`). Os tipos possiveis sao:
- `frequency` - aparece no grafico de Frequencia
- `acceleration` - aparece no grafico de Aceleracao  
- `command_box` - nao aparece em nenhum grafico

O scroll usa `scrollIntoView` com um `setTimeout` de 300ms para dar tempo ao React de renderizar o sensor selecionado antes de rolar.

