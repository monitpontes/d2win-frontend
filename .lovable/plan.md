
# Plano: Integrar Limites de Ponte com API /bridge-limits

## Objetivo

Substituir valores hardcoded nos gráficos por valores dinâmicos obtidos da API `/bridge-limits?bridge_id={id}`.

## Estrutura da API

**Endpoint:** `GET /bridge-limits?bridge_id={id}`

**Resposta:**
```json
[{
  "_id": "68d5531b1d01b9883e9f0181",
  "bridge_id": { "_id": "68b9e38a69deabb365734c4c" },
  "freq_alert": 3.7,
  "freq_critical": 7,
  "accel_alert": 10,
  "accel_critical": 15
}]
```

## Arquivos a Criar

### 1. Serviço de API - `src/lib/api/bridgeLimits.ts`

Novo arquivo para comunicação com a API:
- Interface `ApiBridgeLimits` (estrutura da API)
- Interface `BridgeLimits` (formato do frontend)
- Função `getBridgeLimits(bridgeId)` - GET
- Função `updateBridgeLimits(bridgeId, data)` - PUT (para salvar)

### 2. Hook React Query - `src/hooks/useBridgeLimits.ts`

Hook para gerenciar estado:
- `useBridgeLimits(bridgeId)` - retorna `{ limits, isLoading, error }`
- Usa React Query para cache automático
- Query key: `['bridge-limits', bridgeId]`

## Arquivos a Modificar

### 3. Exportar serviço - `src/lib/api/index.ts`

Adicionar:
```typescript
export { bridgeLimitsService } from './bridgeLimits';
export type { BridgeLimits } from './bridgeLimits';
```

### 4. Usar limites nos gráficos - `src/pages/BridgeDetail.tsx`

| Local | Antes | Depois |
|-------|-------|--------|
| Importação | - | `import { useBridgeLimits } from '@/hooks/useBridgeLimits'` |
| Hook | - | `const { limits } = useBridgeLimits(id)` |
| Linha 512 | `y={3.7}` | `y={limits?.freqAlert ?? 3.7}` |
| Linha 515 | `'Atenção 3.7'` | `` `Atenção ${limits?.freqAlert ?? 3.7}` `` |
| Linha 518 | `y={7.0}` | `y={limits?.freqCritical ?? 7.0}` |
| Linha 521 | `'Alerta 7.0'` | `` `Alerta ${limits?.freqCritical ?? 7.0}` `` |
| Linha 574 | `y={10}` | `y={limits?.accelAlert ?? 10}` |
| Linha 577 | `'Atenção 10'` | `` `Atenção ${limits?.accelAlert ?? 10}` `` |
| Nova linha | - | Adicionar ReferenceLine para `limits?.accelCritical` |

### 5. Carregar limites no dialog - `src/components/admin/BridgeDetailsDialog.tsx`

- Importar e usar `useBridgeLimits`
- Carregar valores existentes da API no formulário
- Atualizar `handleSaveLimits` para chamar API

## Valores de Fallback

Se a API não retornar dados, usar:

| Campo | Fallback |
|-------|----------|
| freq_alert | 3.7 Hz |
| freq_critical | 7.0 Hz |
| accel_alert | 10 m/s² |
| accel_critical | 15 m/s² |

## Fluxo de Dados

```
API /bridge-limits?bridge_id=xxx
         │
         ▼
useBridgeLimits(id)
         │
    ┌────┴────┐
    ▼         ▼
Gráficos   Dialog
(linhas    (form de
 ref.)     config)
```

## Resultado Esperado

- Gráficos mostram linhas de referência com valores do banco de dados
- Legendas exibem valores dinâmicos (ex: "Atenção 4.0" se mudar no banco)
- Formulário de configuração carrega valores atuais
- Fallback seguro se API falhar
