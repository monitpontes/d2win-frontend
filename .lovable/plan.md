
# Plano: Usar Limites Dinâmicos no Cálculo de Status dos Sensores

## Objetivo

Integrar os valores do banco de dados (`bridge-limits`) no cálculo de status/cores dos sensores, substituindo os valores hardcoded usados atualmente.

## Situação Atual

| Local | Problema |
|-------|----------|
| `getSensorStatus(value, type)` | Usa `DEFAULT_THRESHOLDS` hardcoded |
| `calculateVariation(value, type)` | Usa `DEFAULT_THRESHOLDS` hardcoded |
| `getReferenceText(type)` | Usa `DEFAULT_THRESHOLDS` hardcoded |
| BridgeDetail.tsx | Chama funções sem passar limites da API |
| BridgeCard.tsx | Chama funções sem passar limites da API |
| DataAnalysisSection.tsx | Chama funções sem passar limites da API |

A boa notícia: as funções **já suportam** thresholds customizados via parâmetro opcional - só não estão sendo usados.

## Arquivos a Modificar

### 1. Criar Função de Conversão - `src/lib/api/bridgeLimits.ts`

Adicionar função helper para converter `BridgeLimits` (API) para `SensorThresholds` (utilitários):

```typescript
import { type SensorThresholds, DEFAULT_THRESHOLDS } from '@/lib/constants/sensorThresholds';

// Converter BridgeLimits da API para formato SensorThresholds
export function limitsToThresholds(limits: BridgeLimits | null | undefined): SensorThresholds {
  if (!limits) return DEFAULT_THRESHOLDS;
  
  return {
    frequency: {
      normal: limits.freqAlert,           // < freqAlert = Normal
      attention: limits.freqCritical,     // freqAlert - freqCritical = Atenção
      alert: limits.freqCritical,         // > freqCritical = Alerta
      reference: limits.freqAlert,        // Linha de referência
    },
    acceleration: {
      normal: limits.accelAlert,          // < accelAlert = Normal
      attention: limits.accelCritical,    // accelAlert - accelCritical = Atenção
      alert: limits.accelCritical,        // > accelCritical = Alerta
      reference: limits.accelAlert,       // Linha de referência
    },
  };
}
```

### 2. Atualizar BridgeDetail.tsx

| Modificação | Antes | Depois |
|-------------|-------|--------|
| Importar função | - | `import { limitsToThresholds } from '@/lib/api/bridgeLimits'` |
| Criar thresholds | - | `const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits])` |
| getSensorStatus | `getSensorStatus(value, type)` | `getSensorStatus(value, type, thresholds)` |

Locais específicos a atualizar:
- Linha 98: `getSensorStatus(value, sensorType)` → `getSensorStatus(value, sensorType, thresholds)`
- Linha 136: `getSensorStatus(value, sensorType)` → `getSensorStatus(value, sensorType, thresholds)`

### 3. Atualizar BridgeCard.tsx

| Modificação | Descrição |
|-------------|-----------|
| Importar hook | `import { useBridgeLimits } from '@/hooks/useBridgeLimits'` |
| Importar função | `import { limitsToThresholds } from '@/lib/api/bridgeLimits'` |
| Buscar limites | `const { rawLimits } = useBridgeLimits(bridge.id)` |
| Criar thresholds | `const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits])` |
| Passar para funções | `getSensorStatus(value, type, thresholds)` |
| Atualizar variação | `calculateVariation(value, type, thresholds)` |
| Atualizar referência | `getReferenceText(type, thresholds)` |

### 4. Atualizar DataAnalysisSection.tsx

| Modificação | Descrição |
|-------------|-----------|
| Importar hook | `import { useBridgeLimits } from '@/hooks/useBridgeLimits'` |
| Importar função | `import { limitsToThresholds } from '@/lib/api/bridgeLimits'` |
| Buscar limites | `const { rawLimits } = useBridgeLimits(bridgeId)` |
| Criar thresholds | `const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits])` |
| Passar para funções | Atualizar chamadas de `getSensorStatus` e `calculateVariation` |
| Atualizar referências | Substituir `DEFAULT_THRESHOLDS.frequency.normal` por `thresholds.frequency.normal` |

### 5. Atualizar useBridgeLimits.ts

Expor `rawLimits` para acesso ao objeto original da API:

```typescript
return {
  limits,      // Objeto com fallbacks (nunca null)
  rawLimits: data,  // Objeto da API ou undefined
  isLoading,
  error,
  refetch,
};
```

### 6. Exportar Função - `src/lib/api/index.ts`

```typescript
export { bridgeLimitsService, limitsToThresholds } from './bridgeLimits';
```

## Fluxo de Dados Atualizado

```
┌─────────────────────────────────────────────────────────────┐
│                    API /bridge-limits                       │
│  { freq_alert: 3.7, freq_critical: 7.0, ... }              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              useBridgeLimits(bridgeId)                      │
│  Retorna: { limits, rawLimits, isLoading }                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            limitsToThresholds(rawLimits)                    │
│  Converte para formato SensorThresholds                     │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │getSensor │    │calculate │    │getRefere │
     │Status()  │    │Variation │    │nceText() │
     │          │    │          │    │          │
     │→ Cor do  │    │→ % de    │    │→ Texto   │
     │  status  │    │  variação│    │  legenda │
     └──────────┘    └──────────┘    └──────────┘
```

## Resultado Esperado

| Funcionalidade | Comportamento |
|----------------|---------------|
| Indicadores de status (🟢🟡🔴) | Cores calculadas com limites do banco |
| Variação percentual | Calculada com referência do banco |
| Texto de referência | Exibe valores do banco (ex: "< 4.0 Hz") |
| Gráficos (já implementado) | Linhas de referência com valores do banco |
| Fallback | Se API falhar, usa DEFAULT_THRESHOLDS |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/bridgeLimits.ts` | Adicionar função `limitsToThresholds` |
| `src/lib/api/index.ts` | Exportar nova função |
| `src/hooks/useBridgeLimits.ts` | Expor `rawLimits` |
| `src/pages/BridgeDetail.tsx` | Usar thresholds dinâmicos |
| `src/components/dashboard/BridgeCard.tsx` | Usar thresholds dinâmicos |
| `src/components/bridge/DataAnalysisSection.tsx` | Usar thresholds dinâmicos |
