
# Plano: Corrigir Inputs de Limites e Usar Limites Dinâmicos na Legenda 3D

## Problemas Identificados

### 1. Inputs não editáveis na Configuração de Limites
O `parseFloat` no `onChange` pode retornar `NaN` quando o campo fica vazio ou inválido, causando problemas de edição.

### 2. Bridge3D recebe limites hardcoded
Na linha 383-384 de `BridgeDetail.tsx`:
```typescript
// ANTES - valores fixos
frequencyLimits={{ normalToAlert: 3.7, alertToCritical: 7 }}
accelerationLimits={{ normalToAlert: 2.5, alertToCritical: 5.0 }}
```

### 3. Legenda de níveis não usa limites da API
As funções `getFreqLimits()` e `getAccelLimits()` no componente Bridge3D precisam usar os valores passados via props.

## Arquivos a Modificar

### 1. src/components/admin/BridgeDetailsDialog.tsx

**Problema:** Inputs podem ficar bloqueados com `NaN`

| Linha | Antes | Depois |
|-------|-------|--------|
| 335 | `parseFloat(e.target.value)` | `parseFloat(e.target.value) \|\| 0` |
| 344 | `parseFloat(e.target.value)` | `parseFloat(e.target.value) \|\| 0` |
| 358 | `parseFloat(e.target.value)` | `parseFloat(e.target.value) \|\| 0` |
| 367 | `parseFloat(e.target.value)` | `parseFloat(e.target.value) \|\| 0` |

### 2. src/pages/BridgeDetail.tsx

**Problema:** Bridge3D recebe limites hardcoded

| Linha | Antes | Depois |
|-------|-------|--------|
| 383-384 | Props fixas | Usar `limits` da API |

```typescript
// DEPOIS - valores da API
<Bridge3D
  sensors={bridge3DSensors}
  onSensorClick={(sensor) => setSelectedSensor3D(sensor)}
  selectedSensor={selectedSensor3D}
  frequencyLimits={{ 
    normalToAlert: limits.freqAlert, 
    alertToCritical: limits.freqCritical 
  }}
  accelerationLimits={{ 
    normalToAlert: limits.accelAlert, 
    alertToCritical: limits.accelCritical 
  }}
/>
```

### 3. src/components/bridge/Bridge3D.tsx

**Problema:** Legenda usa funções `getFreqLimits()` e `getAccelLimits()` que não existem

Definir funções auxiliares no início do componente:

```typescript
// Adicionar funções que retornam os limites das props
const getFreqLimits = () => freqLimits;  // Já usa props com fallback
const getAccelLimits = () => accelLimits; // Já usa props com fallback
```

Na verdade, olhando o código, `freqLimits` e `accelLimits` já existem (linhas 42-43), então a legenda precisa usar diretamente:

| Linha | Antes | Depois |
|-------|-------|--------|
| 305 | `getFreqLimits().normalToAlert` | `freqLimits.normalToAlert` |
| 306 | `getFreqLimits().*` | `freqLimits.*` |
| 307 | `getFreqLimits().*` | `freqLimits.*` |
| 311 | `getAccelLimits().normalToAlert` | `accelLimits.normalToAlert` |
| 312 | `getAccelLimits().*` | `accelLimits.*` |
| 313 | `getAccelLimits().*` | `accelLimits.*` |

## Fluxo de Dados Corrigido

```
┌─────────────────────────────────────────────────────────────┐
│        API /bridge-limits?bridge_id=xxx                     │
│  { freq_alert: 3.7, freq_critical: 7.0, ... }              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           useBridgeLimits(bridgeId)                         │
│  Retorna: { limits, rawLimits, refetch }                    │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────────┐
         ▼                                       ▼
┌────────────────────┐                  ┌─────────────────┐
│  BridgeDetail.tsx  │                  │  BridgeDetails  │
│                    │                  │  Dialog.tsx     │
│  Pass limits to    │                  │                 │
│  Bridge3D props    │                  │  Form inputs    │
└────────────────────┘                  │  + Save button  │
         │                              └─────────────────┘
         ▼
┌────────────────────────────────────────────────────────────┐
│                    Bridge3D.tsx                            │
│  frequencyLimits prop → freqLimits                         │
│  accelerationLimits prop → accelLimits                     │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │ Cores sensores  │  │ Legenda de Níveis               │ │
│  │ getSensorColor  │  │ Normal (< 3.7 Hz)              │ │
│  │ usa freqLimits  │  │ Atenção (3.7-7 Hz)             │ │
│  │                 │  │ Alerta (> 7 Hz)                │ │
│  └─────────────────┘  └─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

| Funcionalidade | Comportamento |
|----------------|---------------|
| Inputs editáveis | Campos numéricos aceitam edição normalmente |
| Legenda Frequência | Exibe "Normal (< 3.7 Hz)", etc. com valores da API |
| Legenda Aceleração | Exibe "Normal (< 10 m/s²)", etc. com valores da API |
| Cores dos sensores 3D | Calculadas com limites da API |
| Salvar limites | Persiste no banco e atualiza toda UI |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/BridgeDetailsDialog.tsx` | Fix parseFloat para evitar NaN |
| `src/pages/BridgeDetail.tsx` | Passar `limits` dinâmicos ao Bridge3D |
| `src/components/bridge/Bridge3D.tsx` | Usar `freqLimits`/`accelLimits` na legenda |
