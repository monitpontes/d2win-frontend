
# Plano: Valores com "-", Dados de Telemetria do Eixo Z, Tipo de Sensor e Mapa Funcional

## Visão Geral

Este plano corrige os valores vazios para exibir "-", integra os dados reais de telemetria (eixo Z) nos gráficos e tabelas, exibe corretamente o tipo do sensor, e ajusta o mapa para mostrar apenas pontes com coordenadas configuradas (permitindo adicionar lat/lng ou KMZ por ponte).

---

## Problemas Identificados

### 1. Valores Vazios Exibidos como `undefined` ou Vazio
Alguns campos da ponte/sensor não têm valor e aparecem em branco ou undefined. Devem mostrar "-".

### 2. Dados de Telemetria são do Eixo Z
A API retorna dados do eixo Z, mas os gráficos usam dados mock. Precisamos integrar os dados reais.

### 3. Tipo do Sensor Não Verificado
A exibição do tipo do sensor (frequência/aceleração) precisa usar o campo `type` da API.

### 4. Mapa na Tela Inicial
O mapa deve mostrar apenas pontes que têm coordenadas (lat/lng) configuradas. O KMZ global é uma camada separada.

### 5. Gráficos e Tabelas com Dados Mock
Os gráficos de frequência e aceleração usam dados mock. Precisamos conectar à telemetria real.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/BridgeDetail.tsx` | Exibir "-" para valores vazios, usar tipo correto do sensor |
| `src/components/bridge/DataAnalysisSection.tsx` | Integrar dados reais de telemetria, tabelas funcionais |
| `src/hooks/useTelemetry.ts` | Criar hook para buscar dados de telemetria |
| `src/lib/api/telemetry.ts` | Expandir para retornar dados completos por eixo |
| `src/components/dashboard/BridgesMapLeaflet.tsx` | Mostrar apenas pontes com coordenadas |
| `src/components/admin/BridgeDetailsDialog.tsx` | Já está ok, apenas revisar |

---

## Seção Técnica Detalhada

### 1. Exibir "-" para Valores Vazios

Criar função helper para formatar valores:

```typescript
// Função utilitária
const formatValue = (value: any, suffix = ''): string => {
  if (value === null || value === undefined || value === '' || value === 0) {
    return '-';
  }
  return `${value}${suffix}`;
};

// Uso:
<p className="text-xl font-bold">{formatValue(bridge.width, 'm')}</p>
<p className="font-medium">{formatValue(bridge.material)}</p>
```

Aplicar em todos os campos que podem ser vazios:
- `bridge.width` -> `formatValue(bridge.width, 'm')`
- `bridge.constructionYear` -> `formatValue(bridge.constructionYear)`
- `bridge.capacity` -> `formatValue(bridge.capacity, ' ton')`
- `bridge.lastMajorIntervention` -> usar formatação de data ou "-"
- `sensor.lastReading.value` -> verificar antes de exibir

### 2. Criar Hook useTelemetry

```typescript
// src/hooks/useTelemetry.ts
import { useQuery } from '@tanstack/react-query';
import { telemetryService } from '@/lib/api';

export function useTelemetry(bridgeId?: string) {
  const latestQuery = useQuery({
    queryKey: ['telemetry', 'latest', bridgeId],
    queryFn: () => telemetryService.getLatestByBridge(bridgeId!),
    enabled: !!bridgeId,
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  const historyQuery = useQuery({
    queryKey: ['telemetry', 'history', bridgeId],
    queryFn: () => telemetryService.getHistoryByBridge(bridgeId!, { limit: 500 }),
    enabled: !!bridgeId,
  });

  return {
    latestData: latestQuery.data || [],
    historyData: historyQuery.data || [],
    isLoading: latestQuery.isLoading || historyQuery.isLoading,
  };
}
```

### 3. Expandir API de Telemetria

```typescript
// src/lib/api/telemetry.ts - atualizado
export interface TelemetryData {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  frequency?: number;
  acceleration?: { x: number; y: number; z: number };
  axis?: 'x' | 'y' | 'z'; // Eixo principal do dado
}

export async function getHistoryByBridge(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TelemetryData[]> {
  const response = await api.get<TelemetryData[]>(`/telemetry/history/bridge/${bridgeId}`, { params });
  return response.data; // Retorna dados completos
}
```

### 4. Verificar Tipo do Sensor

Na exibição do sensor, usar o campo `type` da API:

```typescript
// Mapeamento de tipos
const sensorTypeLabels: Record<SensorType, string> = {
  'acceleration': 'Aceleração',
  'frequency': 'Frequência',
  'command_box': 'Caixa de Comando',
};

// Uso
<p className="text-xs text-muted-foreground">
  Tipo: {sensorTypeLabels[sensor.type] || sensor.type}
</p>
```

### 5. Gráficos com Dados Reais

No `DataAnalysisSection`, substituir dados mock por dados reais:

```typescript
// Usar hook de telemetria
const { historyData, isLoading } = useTelemetry(bridgeId);

// Transformar para formato do gráfico
const chartData = useMemo(() => {
  if (!historyData.length) return mockData; // Fallback para mock
  
  return historyData.map(item => ({
    date: format(new Date(item.timestamp), 'dd/MM'),
    valueZ: item.acceleration?.z || item.frequency || 0,
    // Eixo Z é o principal conforme mencionado
  }));
}, [historyData]);
```

### 6. Tabela de Dados Funcional

Adicionar visualização em tabela dos dados:

```typescript
{viewMode === 'table' ? (
  <div className="max-h-64 overflow-y-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Sensor</TableHead>
          <TableHead>Eixo Z</TableHead>
          <TableHead>Unidade</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historyData.slice(0, 50).map((item, idx) => (
          <TableRow key={idx}>
            <TableCell>{format(new Date(item.timestamp), 'dd/MM HH:mm')}</TableCell>
            <TableCell>{item.deviceId}</TableCell>
            <TableCell>{item.acceleration?.z?.toFixed(3) || item.frequency?.toFixed(2) || '-'}</TableCell>
            <TableCell>{item.acceleration ? 'm/s²' : 'Hz'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
) : (
  // Gráfico existente
)}
```

### 7. Mapa com Pontes com Coordenadas

O mapa já está configurado para mostrar apenas pontes com coordenadas. Garantir que:

```typescript
// BridgesMapLeaflet.tsx - já implementado
const bridgesWithCoords = bridges.filter(b => b.coordinates?.lat && b.coordinates?.lng);

bridgesWithCoords.forEach(bridge => {
  // Adiciona marcador
});
```

O arquivo KMZ global continua sendo carregado como camada separada. Para KMZ por ponte, será carregado quando `bridge.kmzFile` estiver definido.

### 8. Cards de Sensores na Página da Ponte

Atualizar os cards para usar dados reais dos sensores da API:

```typescript
// Em vez de sensorCards mock, usar sensors da API
{sensors.map((sensor) => (
  <Card key={sensor.id}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Nome</p>
          <p className="font-medium text-sm">{sensor.name}</p>
        </div>
        <Badge variant={sensor.status === 'online' ? 'default' : 'secondary'}>
          {sensor.status}
        </Badge>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tipo</span>
          <span>{sensorTypeLabels[sensor.type] || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Última Leitura</span>
          <span>{sensor.lastReading?.value?.toFixed(2) || '-'} {sensor.lastReading?.unit || ''}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Atualização</span>
          <span>{sensor.lastReading?.timestamp 
            ? formatDistanceToNow(new Date(sensor.lastReading.timestamp), { locale: ptBR, addSuffix: true })
            : '-'
          }</span>
        </div>
      </div>
    </CardContent>
  </Card>
))}
```

---

## Fluxo de Dados

```text
API /telemetry/latest/bridge/:id
         |
         v
    useTelemetry hook
         |
    +----+----+
    |         |
    v         v
 Gráficos  Tabelas
(Recharts) (Table)
```

---

## Resultado Esperado

1. Campos vazios exibem "-" em vez de undefined ou vazio
2. Tipo do sensor é exibido corretamente (Aceleração, Frequência, etc.)
3. Gráficos usam dados reais de telemetria do eixo Z (com fallback para mock)
4. Tabelas funcionam e mostram dados históricos
5. Mapa mostra apenas pontes com coordenadas configuradas
6. KMZ global continua visível como camada separada
7. Ponte pode ter seu próprio KMZ via campo `kmzFile`

---

## Estimativa

- **Tempo:** ~30 minutos
- **Arquivos:** 5-6 arquivos
- **Complexidade:** Média
