

# Plano: Valores de Referência, Variação e Status por Limites de Sensor

## Visão Geral

Este plano implementa:
1. **Valores de referência** para frequência e aceleração
2. **Cálculo de variação** em relação aos limites
3. **Status automático** (Normal, Atenção, Alerta) baseado nos thresholds
4. **Limites configuráveis** salvos localmente (prontos para futura integração com API)

---

## Thresholds Definidos

| Tipo | Normal | Atenção | Alerta |
|------|--------|---------|--------|
| **Frequência** | < 3.7 Hz | 3.7 - 7.0 Hz | > 7.0 Hz |
| **Aceleração** | < 10 m/s² | 10 - 20 m/s² | > 20 m/s² |

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/lib/constants/sensorThresholds.ts` | **CRIAR** | Constantes de limites com valores padrão |
| `src/lib/utils/sensorStatus.ts` | **CRIAR** | Funções para calcular status e variação |
| `src/components/bridge/DataAnalysisSection.tsx` | Modificar | Usar thresholds e mostrar status nos KPIs |
| `src/components/dashboard/BridgeCard.tsx` | Modificar | Mostrar status calculado e variação real |
| `src/pages/BridgeDetail.tsx` | Modificar | Usar thresholds nos gráficos de referência |

---

## Seção Técnica

### 1. Criar Arquivo de Constantes de Thresholds

```typescript
// src/lib/constants/sensorThresholds.ts

export interface SensorThresholds {
  frequency: {
    normal: number;      // < 3.7 Hz
    attention: number;   // 3.7 - 7.0 Hz
    alert: number;       // > 7.0 Hz
    reference: number;   // Valor de referência (3.7 Hz)
  };
  acceleration: {
    normal: number;      // < 10 m/s²
    attention: number;   // 10 - 20 m/s²
    alert: number;       // > 20 m/s²
    reference: number;   // Valor de referência (10 m/s²)
  };
}

// Valores padrão - podem ser alterados pelo backend futuramente
export const DEFAULT_THRESHOLDS: SensorThresholds = {
  frequency: {
    normal: 3.7,      // Abaixo disso é Normal
    attention: 7.0,   // Entre 3.7 e 7.0 é Atenção
    alert: 7.0,       // Acima de 7.0 é Alerta
    reference: 3.7,   // Linha de referência nos gráficos
  },
  acceleration: {
    normal: 10,       // Abaixo disso é Normal
    attention: 20,    // Entre 10 e 20 é Atenção
    alert: 20,        // Acima de 20 é Alerta
    reference: 10,    // Linha de referência nos gráficos
  },
};

// Cores para cada status
export const STATUS_COLORS = {
  normal: { label: 'Normal', color: 'hsl(var(--success))', bgClass: 'bg-success', textClass: 'text-success' },
  attention: { label: 'Atenção', color: 'hsl(var(--warning))', bgClass: 'bg-warning', textClass: 'text-warning' },
  alert: { label: 'Alerta', color: 'hsl(var(--destructive))', bgClass: 'bg-destructive', textClass: 'text-destructive' },
};
```

### 2. Criar Funções de Cálculo de Status e Variação

```typescript
// src/lib/utils/sensorStatus.ts

import { DEFAULT_THRESHOLDS, STATUS_COLORS, type SensorThresholds } from '@/lib/constants/sensorThresholds';

export type SensorStatusType = 'normal' | 'attention' | 'alert';

/**
 * Calcula o status do sensor baseado no valor e tipo
 */
export function getSensorStatus(
  value: number,
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
): SensorStatusType {
  const limits = thresholds[type];
  
  if (value < limits.normal) {
    return 'normal';
  } else if (value <= limits.attention) {
    return 'attention';
  }
  return 'alert';
}

/**
 * Calcula a variação percentual em relação ao valor de referência
 */
export function calculateVariation(
  value: number,
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
): number {
  const reference = thresholds[type].reference;
  if (reference === 0) return 0;
  
  return ((value - reference) / reference) * 100;
}

/**
 * Retorna a configuração visual do status
 */
export function getStatusConfig(status: SensorStatusType) {
  return STATUS_COLORS[status];
}

/**
 * Formata a variação para exibição
 */
export function formatVariation(variation: number): string {
  const sign = variation >= 0 ? '+' : '';
  return `${sign}${variation.toFixed(1)}%`;
}

/**
 * Retorna a cor da variação baseada no valor
 */
export function getVariationColor(variation: number): string {
  const absVariation = Math.abs(variation);
  if (absVariation > 20) return 'text-destructive';
  if (absVariation > 10) return 'text-warning';
  return 'text-success';
}
```

### 3. Atualizar DataAnalysisSection

Usar os thresholds para as linhas de referência e cálculo de status:

```typescript
// Importar thresholds
import { DEFAULT_THRESHOLDS } from '@/lib/constants/sensorThresholds';
import { getSensorStatus, getStatusConfig } from '@/lib/utils/sensorStatus';

// Nos gráficos, usar valores dos thresholds:
<ReferenceLine 
  y={DEFAULT_THRESHOLDS.acceleration.alert} 
  stroke="hsl(var(--destructive))" 
  strokeDasharray="5 5" 
  label={{ value: 'Limite Alerta (20)', fontSize: 9 }} 
/>
<ReferenceLine 
  y={DEFAULT_THRESHOLDS.acceleration.normal} 
  stroke="hsl(var(--warning))" 
  strokeDasharray="5 5" 
  label={{ value: 'Limite Atenção (10)', fontSize: 9 }} 
/>

// Para frequência:
<ReferenceLine 
  y={DEFAULT_THRESHOLDS.frequency.reference} 
  stroke="hsl(var(--muted-foreground))" 
  strokeDasharray="5 5" 
  label={{ value: 'Referência (3.7 Hz)', fontSize: 9 }} 
/>
<ReferenceLine 
  y={DEFAULT_THRESHOLDS.frequency.attention} 
  stroke="hsl(var(--warning))" 
  strokeDasharray="5 5" 
  label={{ value: 'Limite Atenção (7 Hz)', fontSize: 9 }} 
/>
```

### 4. Atualizar BridgeCard para Dados Reais

Integrar telemetria real e calcular status/variação:

```typescript
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDevices } from '@/hooks/useDevices';
import { DEFAULT_THRESHOLDS } from '@/lib/constants/sensorThresholds';
import { getSensorStatus, calculateVariation, formatVariation, getVariationColor, getStatusConfig } from '@/lib/utils/sensorStatus';

// Buscar dados reais
const { latestData } = useTelemetry(bridge.id);
const { devices: sensors } = useDevices(undefined, bridge.id);

// Mapear telemetria para tabela
const sensorReadings = useMemo(() => {
  return latestData.map(telemetry => {
    const isFrequency = telemetry.frequency !== undefined;
    const value = isFrequency ? telemetry.frequency! : telemetry.acceleration?.z || 0;
    const type = isFrequency ? 'frequency' : 'acceleration';
    const status = getSensorStatus(value, type);
    const variation = calculateVariation(value, type);
    
    return {
      sensorName: telemetry.deviceId,
      axis: 'Z',
      type: isFrequency ? 'Frequência' : 'Aceleração',
      lastValue: isFrequency ? `${value.toFixed(2)} Hz` : `${value.toFixed(2)} m/s²`,
      reference: isFrequency 
        ? `< ${DEFAULT_THRESHOLDS.frequency.normal} Hz` 
        : `< ${DEFAULT_THRESHOLDS.acceleration.normal} m/s²`,
      variation,
      status,
      updatedAt: formatDateValue(telemetry.timestamp, 'dd/MM HH:mm'),
    };
  });
}, [latestData]);
```

### 5. Exibir Referência e Status nos Cards

Na tabela do BridgeCard, mostrar:

```typescript
<TableCell className="text-xs text-muted-foreground py-1">
  {reading.reference}
</TableCell>
<TableCell className={cn('text-xs font-medium py-1', getVariationColor(reading.variation))}>
  {formatVariation(reading.variation)}
</TableCell>
<TableCell className="py-1">
  <span className={cn(
    'inline-block h-2.5 w-2.5 rounded-full',
    getStatusConfig(reading.status).bgClass
  )} />
</TableCell>
```

---

## Fluxo de Dados

```text
Dados da API (telemetry/latest)
         |
         v
    Valor bruto (Hz ou m/s²)
         |
    +----+----+
    |         |
    v         v
getSensorStatus()  calculateVariation()
    |              |
    v              v
'normal'|'attention'|'alert'   +15.3%
    |              |
    +------+-------+
           |
           v
    Exibição na UI com cores
```

---

## Estrutura Final

| Componente | Mostra |
|------------|--------|
| **BridgeCard (Tabela)** | Valor atual, Referência, Variação %, Status (●) |
| **BridgeCard (Gráfico)** | Linhas de referência, cores por status |
| **DataAnalysisSection** | Linhas de limite crítico e alerta |
| **KPI Cards** | Média, Min, Max, Pico com indicadores de status |

---

## Preparação para Integração Futura

O arquivo `sensorThresholds.ts` pode ser facilmente atualizado para buscar valores do backend:

```typescript
// Futuramente:
export async function fetchThresholds(companyId: string): Promise<SensorThresholds> {
  const response = await api.get(`/settings/thresholds/${companyId}`);
  return response.data;
}
```

Por enquanto os valores ficam hardcoded conforme especificado.

---

## Resultado Esperado

1. Valores de referência exibidos em todas as tabelas e gráficos
2. Variação calculada em relação ao limite Normal (3.7 Hz / 10 m/s²)
3. Status automático com cores:
   - **Verde (Normal)**: Frequência < 3.7 Hz / Aceleração < 10 m/s²
   - **Amarelo (Atenção)**: Frequência 3.7-7 Hz / Aceleração 10-20 m/s²
   - **Vermelho (Alerta)**: Frequência > 7 Hz / Aceleração > 20 m/s²
4. Linhas de referência nos gráficos
5. Pronto para integração com API de configurações

---

## Estimativa

- **Tempo:** ~25 minutos
- **Arquivos:** 5-6 arquivos
- **Complexidade:** Média

