

# Plano: Melhorias no BridgeCard - Carregamento Inicial, Status 10min e Tabela Ajustada

## Resumo das Alterações

1. **Carregar dados iniciais de uma vez** - Usar `useDevices` para mostrar todos os sensores imediatamente
2. **Status baseado em 10 minutos** - Sensor ativo se último dado foi enviado nos últimos 10 minutos
3. **Tabela com 7 colunas** - Sensor | Eixo | Último Valor | Referência | Variação | Status | Atualizado

---

## Estrutura da Tabela Final

| Sensor | Eixo | Último Valor | Referência | Variação | Status | Atualizado |
|--------|------|--------------|------------|----------|--------|------------|
| Motiva_P1_S02 | Z | 10.07 m/s² | < 10 m/s² | +0.7% | ● | 04/02 15:12:58 |

Removido apenas a coluna "Tipo" para economizar espaço.

---

## Alterações Técnicas

### 1. Carregar Devices do Banco Primeiro

```typescript
// Adicionar useDevices
const { devices, isLoading: isLoadingDevices } = useDevices(undefined, bridge.id);
const { latestData, timeSeriesData } = useTelemetry(bridge.id);

// Combinar devices com telemetria
const sensorReadings = useMemo(() => {
  if (devices.length === 0 && latestData.length === 0) return [];
  
  // Se temos devices, usar como base (garante que todos aparecem)
  if (devices.length > 0) {
    return devices.map(device => {
      const telemetry = latestData.find(t => t.deviceId === device.id);
      // ... mapear dados
    });
  }
  
  // Fallback para latestData se não tiver devices
  return latestData.map(telemetry => {
    // ... mapear dados
  });
}, [devices, latestData]);
```

### 2. Status Baseado em 10 Minutos

```typescript
const TEN_MINUTES_MS = 10 * 60 * 1000;

const calculateSensorStatus = (timestamp: string | undefined): 'online' | 'offline' => {
  if (!timestamp) return 'offline';
  return (Date.now() - new Date(timestamp).getTime()) < TEN_MINUTES_MS ? 'online' : 'offline';
};
```

### 3. Tabela Simplificada (Sem Coluna Tipo)

```tsx
<TableHeader>
  <TableRow className="bg-muted/50">
    <TableHead className="text-xs h-8">Sensor</TableHead>
    <TableHead className="text-xs h-8">Eixo</TableHead>
    <TableHead className="text-xs h-8">Último Valor</TableHead>
    <TableHead className="text-xs h-8">Referência</TableHead>
    <TableHead className="text-xs h-8">Variação</TableHead>
    <TableHead className="text-xs h-8">Status</TableHead>
    <TableHead className="text-xs h-8">Atualizado</TableHead>
  </TableRow>
</TableHeader>
```

### 4. Footer com Contagem de Sensores Ativos

```tsx
<span>🔌 {activeSensorsCount}/{sensorReadings.length} sensores ativos</span>
```

---

## Fluxo de Carregamento

```text
1. BridgeCard monta
   ├── useDevices(bridge.id) → HTTP busca devices (instantâneo)
   └── useTelemetry(bridge.id) → HTTP busca telemetria

2. Renderização Inicial (< 500ms)
   ├── Tabela mostra TODOS devices do banco
   ├── Valores preenchidos onde há telemetria
   └── "-" e status "offline" onde não há dados

3. WebSocket conecta
   └── Atualiza valores em tempo real
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/BridgeCard.tsx` | Adicionar useDevices, lógica 10min, ajustar tabela |

