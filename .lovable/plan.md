
# Plano: Priorizar Dados Iniciais do Endpoint Latest

## Problema Identificado

O `useTelemetry` está usando `historyQuery.data` como base para combinar dados (linha 40), mas este endpoint é mais lento. Enquanto isso, `latestQuery.data` retorna mais rápido e já contém os últimos valores de cada sensor.

**Fluxo atual (problemático):**
```text
1. Página carrega
2. latestQuery carrega (rápido) → mas não é usado como base
3. historyQuery carrega (lento) → usado como base  
4. Até historyQuery carregar → tabela mostra "-"
```

## Solução

Alterar a lógica de `combinedData` para usar **latestQuery como base primária**, com historyQuery como fallback:

```text
1. Se latestQuery.data existe → usar como base (valores aparecem rápido)
2. Depois historyQuery carregar → enriquecer com dados históricos
3. WebSocket → atualizar em tempo real
```

---

## Alterações no `useTelemetry.ts`

### Antes (linha 39-62):
```typescript
const combinedData = useMemo(() => {
  const httpData = historyQuery.data || [];         // ← Lento como base
  const latestModes = latestQuery.data || [];       // ← Rápido ignorado

  // ... merge logic usando httpData como base
}, [latestQuery.data, historyQuery.data, realtimeData]);
```

### Depois:
```typescript
const combinedData = useMemo(() => {
  // Priorizar latestQuery (mais rápido) como base
  const latestModes = latestQuery.data || [];
  const historyData = historyQuery.data || [];

  // Criar mapa de histórico para enriquecer depois
  const historyByDevice = new Map<string, TelemetryData>();
  historyData.forEach((h) => historyByDevice.set(h.deviceId, h));

  // Base: latestQuery (rápido) → mostra valores imediatamente
  let merged: TelemetryData[] = latestModes.length > 0 
    ? latestModes.map((latest) => ({
        ...latest,
        // Enriquecer com dados do histórico se disponível
        ...(historyByDevice.get(latest.deviceId) || {}),
        ...latest, // latest sobrescreve para garantir valor mais recente
      }))
    : historyData; // Fallback para histórico se latest vazio

  // WebSocket: atualizar dados em tempo real
  realtimeData.forEach((rt) => {
    const idx = merged.findIndex((m) => m.deviceId === rt.deviceId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], ...rt };
    } else {
      merged.push(rt);
    }
  });

  return merged;
}, [latestQuery.data, historyQuery.data, realtimeData]);
```

---

## Fluxo Corrigido

```text
Timeline
─────────────────────────────────────────────────────►
   0ms         200ms           500ms           1000ms+
    │            │                │                │
    │            ▼                │                ▼
    │   latestQuery retorna       │       historyQuery retorna
    │   → Tabela mostra valores   │       → Dados históricos disponíveis
    │                             │                │
    └─────────────────────────────┴────────────────┘
                      │
                      ▼
              WebSocket atualiza
              → Dados em tempo real
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTelemetry.ts` | Priorizar `latestQuery.data` como base no `combinedData` |

---

## Benefícios

1. **Carregamento instantâneo**: Tabela mostra valores assim que `latestQuery` retorna (~200ms)
2. **Sem valores vazios**: Usuário não vê "-" durante o carregamento
3. **Histórico preservado**: Quando `historyQuery` carrega, enriquece os dados
4. **WebSocket continua funcionando**: Atualizações em tempo real não mudam
