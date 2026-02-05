

# Plano: Aumentar Largura e Restaurar Altura do Card de Ponte

## Visualização

### COMO ESTÁ AGORA (3 cards por linha em telas XL)
```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DASHBOARD                                              │
├─────────────────────────┬─────────────────────────┬─────────────────────────────────────┤
│   Card Ponte 1          │   Card Ponte 2          │   Card Ponte 3                      │
│   ┌─────────────────┐   │   ┌─────────────────┐   │   ┌─────────────────┐               │
│   │ Tabela (33%)    │   │   │ Tabela (33%)    │   │   │ Tabela (33%)    │               │
│   │ Colunas cortadas│   │   │ Colunas cortadas│   │   │ Colunas cortadas│               │
│   │ max-h: 280px    │   │   │ max-h: 280px    │   │   │ max-h: 280px    │               │
│   └─────────────────┘   │   └─────────────────┘   │   └─────────────────┘               │
└─────────────────────────┴─────────────────────────┴─────────────────────────────────────┘
                          ↑ pouco espaço horizontal para as 7 colunas
```

### COMO VAI FICAR (2 cards por linha)
```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DASHBOARD                                              │
├───────────────────────────────────────────┬───────────────────────────────────────────────┤
│         Card Ponte 1 (50% largura)        │          Card Ponte 2 (50% largura)           │
│   ┌─────────────────────────────────┐     │   ┌─────────────────────────────────┐         │
│   │ Sensor │ Eixo │ Valor │ Ref │...│     │   │ Sensor │ Eixo │ Valor │ Ref │...│         │
│   │ ACC-01 │  Z   │ 9.45  │ 9.0 │...│     │   │ ACC-01 │  Z   │ 8.20  │ 8.0 │...│         │
│   │ FRQ-02 │  X   │ 3.21  │ 3.5 │...│     │   │ FRQ-02 │  X   │ 4.10  │ 4.0 │...│         │
│   │ ACC-03 │  Y   │ 7.80  │ 8.0 │...│     │   │ ACC-03 │  Y   │ 6.90  │ 7.0 │...│         │
│   │        TABELA COMPLETA         │     │   │        TABELA COMPLETA          │         │
│   │        max-h: 320px            │     │   │        max-h: 320px             │         │
│   └─────────────────────────────────┘     │   └─────────────────────────────────┘         │
└───────────────────────────────────────────┴───────────────────────────────────────────────┘
                     ↑ mais espaço horizontal = colunas visíveis
```

## Mudanças

### 1. src/pages/Dashboard.tsx (linha 291)

Reduzir de 3 para 2 cards por linha em telas grandes:

```typescript
// ANTES
<div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

// DEPOIS  
<div className="grid gap-6 lg:grid-cols-2">
```

### 2. src/components/dashboard/BridgeCard.tsx (linha 311)

Aumentar altura da tabela de 280px para 320px:

```typescript
// ANTES
<div className="max-h-[280px] overflow-auto">

// DEPOIS
<div className="max-h-[320px] overflow-auto">
```

## Resumo

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Cards por linha (XL) | 3 | 2 |
| Cards por linha (LG) | 2 | 2 |
| Largura do card | ~33% | ~50% |
| Altura tabela | 280px | 320px |

Isso dará mais espaço horizontal para as 7 colunas da tabela ficarem visíveis sem corte.

