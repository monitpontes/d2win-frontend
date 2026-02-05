
# Plano: Mostrar Card com Estado de Carregamento

## Problema Atual

Os dispositivos (nomes dos sensores) carregam antes da telemetria, causando uma exibição com valores "-" temporariamente antes dos dados reais aparecerem.

## Solução

Mostrar um skeleton/loading state no card inteiro enquanto a telemetria ainda está carregando. Só exibir a tabela com dados quando AMBOS estiverem prontos.

## Visualização

### COMO ESTÁ AGORA
```text
┌─────────────────────────────────────────┐
│ OAE km 54+313                    Ponte  │
│ ○ Localização                           │
├─────────────────────────────────────────┤
│ Sensor       │ Eixo │ Valor │ ...       │
├──────────────┼──────┼───────┼───────────┤
│ Motiva_P1_S01│  Z   │   -   │  ...      │  ← Problema: "-" aparece
│ Motiva_P1_S02│  Z   │   -   │  ...      │
│ Motiva_P1_S03│  Z   │   -   │  ...      │
└─────────────────────────────────────────┘
```

### COMO VAI FICAR (durante carregamento)
```text
┌─────────────────────────────────────────┐
│ OAE km 54+313                    Ponte  │
│ ○ Localização                           │
├─────────────────────────────────────────┤
│                                         │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│   Carregando dados dos sensores...      │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                                         │
└─────────────────────────────────────────┘
```

### COMO VAI FICAR (após carregar)
```text
┌─────────────────────────────────────────┐
│ OAE km 54+313                    Ponte  │
│ ○ Localização                           │
├─────────────────────────────────────────┤
│ Sensor       │ Eixo │ Valor │ ...       │
├──────────────┼──────┼───────┼───────────┤
│ Motiva_P1_S01│  Z   │3.58 Hz│  ...      │  ← Valores reais
│ Motiva_P1_S02│  Z   │10.1m/s│  ...      │
│ Motiva_P1_S03│  Z   │3.55 Hz│  ...      │
└─────────────────────────────────────────┘
```

## Mudanças em `src/components/dashboard/BridgeCard.tsx`

### 1. Adicionar `isLoading` do hook de devices

```typescript
// Linha ~63
const { devices, isLoading: isDevicesLoading } = useDevices(undefined, bridge.id);
```

### 2. Criar flag combinada de loading

```typescript
// Nova variável após os hooks (~linha 70)
const isDataLoading = isDevicesLoading || isTelemetryLoading;
```

### 3. Substituir conteúdo da seção de dados por skeleton durante loading

No `CardContent` (~linha 279), antes da área de Tabs/Tabela, adicionar verificação:

```typescript
<CardContent className="flex-1 pb-3">
  {isDataLoading ? (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <div className="flex space-x-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <p className="text-sm text-muted-foreground">Carregando dados dos sensores...</p>
      <div className="w-full space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  ) : (
    <>
      {/* Conteúdo existente: Tabs, Tabela, Gráficos */}
    </>
  )}
  
  {/* Footer Stats - sempre visível */}
  <div className="flex items-center justify-between mt-3 pt-3 border-t ...">
```

### 4. Manter footer sempre visível

O rodapé com "sensores ativos" e "Atualizado" permanece visível mesmo durante o loading, mas o contador mostrará 0 durante o carregamento.

## Resumo

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Durante loading | Mostra tabela com "-" | Mostra skeleton centralizado |
| Texto feedback | Nenhum | "Carregando dados dos sensores..." |
| UX | Confuso (valores vazios) | Claro (estado de loading) |
