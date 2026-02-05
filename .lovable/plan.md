
# Plano: Exibir Valores Recentes Imediatamente ao Carregar as Páginas

## Problema Identificado

Atualmente, quando o usuário acessa o Dashboard ou a página de detalhes da ponte:

1. A página carrega e mostra `-` nos valores
2. A API `/telemetry/latest` é chamada (demora ~200-500ms)
3. Depois que a API responde, os valores aparecem

O usuário vê um "flash" de valores vazios antes dos dados reais aparecerem.

## Causa Raiz

O hook `useTelemetry` faz queries HTTP assíncronas:
- `latestQuery` busca `/telemetry/latest/bridge/{id}`
- Durante o loading, `latestQuery.data` é `undefined`
- Componentes exibem `-` enquanto aguardam

## Solução Proposta

### Estratégia: Loading State Visual + Skeleton

Em vez de mostrar "-" durante o carregamento, exibir um estado de loading visual (skeleton) que indica que os dados estão sendo carregados. Isso é mais profissional e evita a impressão de "dados vazios".

### Alternativa: Dados em Cache Persistente

Usar `localStorage` para cachear os últimos valores e exibi-los imediatamente enquanto a API atualiza. Assim o usuário vê os últimos valores conhecidos instantaneamente.

## Arquivos a Modificar

### 1. src/hooks/useTelemetry.ts

Adicionar lógica de cache persistente:

```typescript
// Ao receber dados da API, salvar no localStorage
useEffect(() => {
  if (combinedData.length > 0 && bridgeId) {
    localStorage.setItem(`telemetry-cache-${bridgeId}`, JSON.stringify(combinedData));
  }
}, [combinedData, bridgeId]);

// Ao iniciar, carregar do cache se existir
const cachedData = useMemo(() => {
  if (!bridgeId) return [];
  const cached = localStorage.getItem(`telemetry-cache-${bridgeId}`);
  return cached ? JSON.parse(cached) : [];
}, [bridgeId]);

// Usar cache enquanto carrega
const latestData = isLoading && cachedData.length > 0 ? cachedData : combinedData;
```

Retornar também flag `isFromCache` para indicar dados antigos.

### 2. src/components/dashboard/BridgeCard.tsx

Usar o estado de loading para mostrar skeleton:

| Local | Antes | Depois |
|-------|-------|--------|
| displayValue | Mostra "-" se undefined | Mostra Skeleton se loading E sem cache |
| Timestamp | Mostra "-" | Mostra "Carregando..." ou Skeleton |

```typescript
const { latestData, isLoading, isFromCache } = useTelemetry(bridge.id);

// Na tabela
<TableCell className="text-xs font-medium py-1">
  {isLoading && !latestData.length 
    ? <Skeleton className="h-4 w-16" />
    : reading.lastValue
  }
</TableCell>
```

### 3. src/pages/BridgeDetail.tsx

Aplicar mesma lógica nos cards de sensores:

- Mostrar skeleton durante loading inicial
- Exibir valores do cache se disponíveis
- Atualizar para valores reais quando API responder

## Fluxo de Dados Atualizado

```text
┌─────────────────────────────────────────────────────────────┐
│                    Primeira Visita                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Componente monta                                        │
│  2. Verifica localStorage → vazio                           │
│  3. Mostra Skeleton (loading visual)                        │
│  4. API responde → mostra valores + salva cache             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Visitas Subsequentes                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Componente monta                                        │
│  2. Verifica localStorage → TEM CACHE                       │
│  3. Mostra valores do cache IMEDIATAMENTE (isFromCache=true)│
│  4. API responde → atualiza para valores frescos            │
│  5. WebSocket conecta → atualiza em tempo real              │
└─────────────────────────────────────────────────────────────┘
```

## Detalhes Técnicos

### Cache Key Format
```
telemetry-cache-{bridgeId}
```

### Estrutura do Cache
```json
{
  "data": [...telemetryData],
  "timestamp": "2025-02-05T10:30:00Z"
}
```

### Expiração do Cache
- Cache nunca expira automaticamente (sempre mostra algo)
- Valores são atualizados assim que API responder
- Indicador visual sutil se dados são do cache (opcional)

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Primeira visita | Mostra "-" por 200-500ms | Mostra Skeleton por 200-500ms |
| Visita subsequente | Mostra "-" por 200-500ms | Mostra valores do cache INSTANTANEAMENTE |
| WebSocket conecta | Atualiza valores | Atualiza valores (sem mudança) |
| Após atualização | Valores atualizados | Valores atualizados |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTelemetry.ts` | Adicionar cache localStorage + flag isFromCache |
| `src/components/dashboard/BridgeCard.tsx` | Usar Skeleton durante loading sem cache |
| `src/pages/BridgeDetail.tsx` | Usar Skeleton durante loading sem cache |
