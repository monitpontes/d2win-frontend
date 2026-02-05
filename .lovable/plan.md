
# Plano: Garantir Ultimo Valor do Banco na Primeira Carga

## Problema Identificado

Quando a pagina carrega:
1. A API `/telemetry/latest` retorna apenas sensores com leitura recente (online)
2. Sensores que estao offline ou sem dados recentes aparecem com "-"
3. O usuario quer ver **sempre** o ultimo valor historico, mesmo de sensores parados

### Evidencia nas Imagens
- Motiva_P1_S01, S03, S04, S05 mostram "-" na tabela
- Motiva_P1_S02 mostra "9.96 m/s^2" porque teve leitura recente
- O painel 3D mostra "- Hz" para frequencia e magnitude

## Causa Raiz

O endpoint `/telemetry/latest` so retorna dispositivos com atividade recente. O endpoint `/telemetry/history` tem os dados historicos, mas a logica de merge prioriza o `latest` e nao preenche sensores ausentes.

## Solucao Proposta

### Estrategia: Merge Inteligente + Polling Agressivo

1. **Inverter a prioridade do merge**: usar `historyData` como base (tem todos os sensores com ultimo valor), depois enriquecer com `latestQuery` e `realtimeData`
2. **Polling inicial de 5 segundos**: fazer refetch a cada 1 segundo nos primeiros 5 segundos para capturar dados que ainda nao chegaram
3. **Fallback para cache local**: se nenhum dado da API, usar localStorage

## Arquivos a Modificar

### 1. src/hooks/useTelemetry.ts

**Mudanca principal:** Inverter merge para `historyData` ser a base

| Antes | Depois |
|-------|--------|
| Base = `latestQuery`, fallback = `historyData` | Base = `historyData` (tem todos sensores), enriquece com `latestQuery` |

```typescript
// ANTES - prioriza latest (pode ter menos sensores)
let merged = latestModes.length > 0 
  ? latestModes.map(latest => ({ ...historyByDevice.get(latest.deviceId), ...latest }))
  : historyData;

// DEPOIS - base sempre e historico (todos sensores), enriquece com latest
let merged: TelemetryData[] = historyData.length > 0 
  ? historyData.map(history => ({
      ...history,  // Base: ultimo valor do historico
      ...(latestByDevice.get(history.deviceId) || {}),  // Sobrescreve se tiver latest mais recente
    }))
  : latestModes;  // Fallback se historico vazio
```

**Adicionar:** Polling agressivo nos primeiros 5 segundos

```typescript
// Polling inicial para capturar dados rapidamente
const [initialPolling, setInitialPolling] = useState(true);

useEffect(() => {
  if (!bridgeId || !initialPolling) return;
  
  // Polling a cada 1s por 5 segundos
  const interval = setInterval(() => {
    latestQuery.refetch();
    historyQuery.refetch();
  }, 1000);
  
  // Para apos 5 segundos
  const timeout = setTimeout(() => {
    setInitialPolling(false);
    clearInterval(interval);
  }, 5000);
  
  return () => {
    clearInterval(interval);
    clearTimeout(timeout);
  };
}, [bridgeId, initialPolling]);
```

### 2. src/components/dashboard/BridgeCard.tsx

**Mudanca:** Cruzar devices (banco) com telemetry corrigida

A logica ja esta correta (usa `devices` como base), mas precisa garantir que `latestData` agora tera todos os sensores com ultimo valor.

Adicionar indicador visual sutil quando dados sao do cache:

```typescript
// No footer do card, adicionar indicador se dados sao antigos
{isFromCache && (
  <span className="text-xs text-muted-foreground flex items-center gap-1">
    <Clock className="h-3 w-3" />
    Dados em cache
  </span>
)}
```

### 3. src/pages/BridgeDetail.tsx

Mesma logica - com o merge corrigido no hook, os dados de sensores offline virao preenchidos automaticamente.

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────┐
│                  Pagina Carrega                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Carrega localStorage cache (instantaneo)                │
│  2. Dispara latestQuery + historyQuery em paralelo          │
│  3. Inicia polling (1s) por 5 segundos                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│          Merge Inteligente (historyData como base)          │
│                                                             │
│  historyData = [S01: 3.5Hz, S02: 9.96m/s, S03: 3.2Hz, ...]  │
│  latestData  = [S02: 9.98m/s]  (so online)                  │
│                                                             │
│  merged = historyData.map(h => ({ ...h, ...latestByDevice }))│
│  Resultado: TODOS sensores com ultimo valor conhecido       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              WebSocket (tempo real)                         │
│  Quando chega novo dado, atualiza merged[deviceId]          │
└─────────────────────────────────────────────────────────────┘
```

## Resultado Esperado

| Cenario | Antes | Depois |
|---------|-------|--------|
| Sensor S01 offline ha 2 dias | Mostra "-" | Mostra "3.50 Hz" (ultimo valor) |
| Sensor S02 online | Mostra "9.96 m/s^2" | Mostra "9.96 m/s^2" (sem mudanca) |
| Primeira carga sem cache | Mostra "-" por 200ms | Mostra ultimo valor do historico |
| WebSocket envia dado novo | Atualiza valor | Atualiza valor (sem mudanca) |

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useTelemetry.ts` | Inverter merge + adicionar polling 5s |
| `src/components/dashboard/BridgeCard.tsx` | Indicador visual de cache (opcional) |
