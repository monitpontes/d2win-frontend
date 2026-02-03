
# Plano: Corrigir Exibição de Sensores Baseada no Modo de Operação

## Problema Identificado

Analisando os logs da API `/telemetry/latest/bridge/{id}`:

```json
{
  "devices": [
    {
      "device_id": "Motiva_P1_S01",
      "modo_operacao": "frequencia",  // ← Tipo do sensor
      "accel": null,                  // ← Sem dados agora
      "freq": null                    // ← Sem dados agora
    },
    {
      "device_id": "Motiva_P1_S02",
      "modo_operacao": "aceleracao",  // ← Tipo DIFERENTE
      "accel": null,
      "freq": null
    }
  ]
}
```

### Erros Atuais:
1. **Tipo incorreto**: O código verifica se `frequency !== undefined` para determinar o tipo, mas deveria usar `modo_operacao`
2. **Dados vazios**: Quando `accel` e `freq` são `null`, o código não exibe o tipo correto nem mostra "-"
3. **Valor e timestamp**: Precisamos buscar os dados mais recentes de cada device individualmente

---

## Solução

### 1. Atualizar Mapeamento de Telemetria

O tipo do sensor deve ser determinado por `modo_operacao`, não pela presença de dados:

| `modo_operacao` | Tipo | Campo de Valor | Unidade |
|-----------------|------|----------------|---------|
| `"frequencia"` | Frequência | `freq.peaks[0].f` | Hz |
| `"aceleracao"` | Aceleração | `accel.value` | m/s² |

### 2. Exibir "-" Quando Não Há Dados

Quando `accel` ou `freq` são `null`, exibir:
- **Valor**: `-`
- **Timestamp**: `-`
- **Tipo**: Baseado em `modo_operacao` (sempre exibir)

### 3. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/telemetry.ts` | Incluir `modoOperacao` no mapeamento e usar para determinar tipo |
| `src/components/dashboard/BridgeCard.tsx` | Usar `modoOperacao` em vez de verificar se frequency existe |

---

## Seção Técnica

### Atualização em `telemetry.ts`

A função `mapApiDeviceToTelemetry` já inclui `modoOperacao`. O problema está no **BridgeCard** que não usa esse campo.

### Atualização em `BridgeCard.tsx`

```typescript
// ANTES (incorreto):
const isFrequency = telemetry.frequency !== undefined;

// DEPOIS (correto):
const isFrequency = telemetry.modoOperacao === 'frequencia';
const isAcceleration = telemetry.modoOperacao === 'aceleracao';
```

E para o valor:

```typescript
// Extrair valor baseado no modo de operação
let value: number | undefined;
if (isFrequency) {
  value = telemetry.frequency;  // pode ser undefined se freq é null
} else if (isAcceleration) {
  value = telemetry.acceleration?.z;  // pode ser undefined se accel é null
}

// Formatar exibição
const displayValue = value !== undefined 
  ? `${value.toFixed(2)} ${isFrequency ? 'Hz' : 'm/s²'}`
  : '-';
```

### Atualização em `sensorStatus.ts`

Adicionar verificação para valores undefined:

```typescript
export function getSensorStatus(
  value: number | undefined,
  type: 'frequency' | 'acceleration'
): SensorStatusType {
  if (value === undefined) return 'normal';  // ou 'unknown' se preferir
  // ... resto do código
}

export function calculateVariation(
  value: number | undefined,
  type: 'frequency' | 'acceleration'
): number | undefined {
  if (value === undefined) return undefined;
  // ... resto do código
}
```

---

## Fluxo Corrigido

```text
API /telemetry/latest/bridge/{id}
         |
         v
    devices[] com modo_operacao
         |
         v
    Determinar tipo por modo_operacao
    (não pela presença de dados)
         |
    +----+----+
    |         |
    v         v
"frequencia"  "aceleracao"
    |              |
    v              v
freq?.peaks    accel?.value
    |              |
    +------+-------+
           |
           v
    Exibir valor ou "-"
    Sempre exibir tipo correto
```

---

## Resultado Esperado

| Device | Modo Operação | freq | accel | Exibição |
|--------|---------------|------|-------|----------|
| S01 | frequencia | `{peaks:[{f:3.5}]}` | null | `3.50 Hz` - Frequência |
| S02 | aceleracao | null | `{value:9.8}` | `9.80 m/s²` - Aceleração |
| S03 | frequencia | null | null | `-` - Frequência |
| S04 | aceleracao | null | null | `-` - Aceleração |

---

## Estimativa

- **Tempo:** ~15 minutos
- **Arquivos:** 3 arquivos
- **Complexidade:** Baixa
