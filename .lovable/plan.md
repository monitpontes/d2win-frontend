

# Plano: Ajustar Tabela do BridgeCard

## Visualização

### COMO ESTÁ AGORA
```text
┌────────────────────────────────────────────────────────────────────────────────┐
│ Sensor       │ Eixo │ Último Valor │  Ref.   │  Var.   │ St. │ Atualizado     │
├──────────────┼──────┼──────────────┼─────────┼─────────┼─────┼────────────────┤
│ Motiva_P1_S01│  Z   │  3.55 Hz     │ < 3.7 Hz│  -4.0%  │  ●  │ 05/02 14:32:01 │ (h-7)
│ Motiva_P1_S02│  Z   │  9.92 m/s²   │ <12 m/s²│ -17.4%  │  ●  │ 05/02 14:32:01 │
│ Motiva_P1_S03│  Z   │  3.55 Hz     │ < 3.7 Hz│  -4.0%  │  ●  │ 05/02 14:32:01 │
└──────────────┴──────┴──────────────┴─────────┴─────────┴─────┴────────────────┘
                         ↑ 7 colunas, linhas baixas
```

### COMO VAI FICAR
```text
┌─────────────────────────────────────────────────────────────────────┐
│ Sensor       │ Eixo │   Valor    │   Ref.   │ St. │  Atualizado    │
├──────────────┼──────┼────────────┼──────────┼─────┼────────────────┤
│ Motiva_P1_S01│  Z   │  3.55 Hz   │ < 3.7 Hz │  ●  │ 05/02 14:32:01 │ (h-8)
│              │      │            │          │     │                │
│ Motiva_P1_S02│  Z   │  9.92 m/s² │ <12 m/s² │  ●  │ 05/02 14:32:01 │
│              │      │            │          │     │                │
│ Motiva_P1_S03│  Z   │  3.55 Hz   │ < 3.7 Hz │  ●  │ 05/02 14:32:01 │
└──────────────┴──────┴────────────┴──────────┴─────┴────────────────┘
     ↑ 6 colunas (sem Var.), linhas mais altas, espaçamento menor
```

## Mudanças em `src/components/dashboard/BridgeCard.tsx`

### 1. Aumentar altura das linhas

| Elemento | Antes | Depois |
|----------|-------|--------|
| Header row | `h-6` | `h-8` |
| Body row | `h-7` | `h-8` |
| Skeleton row | `h-7` | `h-8` |

### 2. Reduzir espaçamento entre colunas

Remover padding horizontal e usar padding mínimo:
- Header: `px-2` (antes implícito maior)
- Cells: `px-2` 

### 3. Renomear coluna

| Antes | Depois |
|-------|--------|
| `Último Valor` | `Valor` |

### 4. Remover coluna Variação

Remover do header:
```typescript
// REMOVER
<TableHead className="...">Var.</TableHead>
```

Remover do body:
```typescript
// REMOVER
<TableCell className={cn('...', getVariationColor(reading.variation))}>
  {formatVariation(reading.variation)}
</TableCell>
```

Remover do skeleton:
```typescript
// REMOVER
<TableCell className="py-0.5"><Skeleton className="h-3 w-10" /></TableCell>
```

## Resumo das Mudanças

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Altura linhas | h-6/h-7 | h-8 |
| Colunas | 7 | 6 (sem Var.) |
| Header "Último Valor" | "Último Valor" | "Valor" |
| Padding colunas | implícito | px-2 compacto |

