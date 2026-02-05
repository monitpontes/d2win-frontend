
# Plano: Adaptar Tabela do BridgeCard à Largura da Tela

## Objetivo

Fazer a tabela se adaptar melhor à largura disponível, mostrando as colunas de forma mais completa e com melhor uso do espaço.

## Mudanças em `src/components/dashboard/BridgeCard.tsx`

### 1. Reduzir Espaçamentos

| Elemento | Atual | Novo |
|----------|-------|------|
| Header height | `h-8` | `h-6` |
| Body row height | `h-9` | `h-7` |
| Cell padding | `py-1` | `py-0.5` |
| Font size células | `text-xs` | `text-[11px]` |

### 2. Tabela com Largura Total

Remover overflow wrapper duplicado e usar `w-full` com `table-fixed` para distribuir colunas:

```typescript
<div className="border rounded-md overflow-hidden">
  <div className="max-h-[280px] overflow-auto">
    <Table className="w-full">
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 whitespace-nowrap">Sensor</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 w-10">Eixo</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 whitespace-nowrap">Último Valor</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 whitespace-nowrap">Ref.</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 w-14">Var.</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 w-8">St.</TableHead>
          <TableHead className="text-[11px] h-6 py-0.5 sticky top-0 bg-muted/95 whitespace-nowrap">Atualizado</TableHead>
        </TableRow>
      </TableHeader>
```

### 3. Ajustar Células do Body

- Reduzir padding para `py-0.5` e `px-1`
- Usar `text-[11px]` para fonte menor
- Adicionar `whitespace-nowrap` onde necessário

### 4. Abreviar Headers

| Atual | Novo |
|-------|------|
| Referência | Ref. |
| Variação | Var. |
| Status | St. |

## Seção Técnica

Modificações no arquivo `src/components/dashboard/BridgeCard.tsx`:
- Linhas 314-322: atualizar headers com classes compactas
- Linhas 328-336: skeleton rows mais compactos
- Linhas 340-354: body rows mais compactos

O componente `Table` do shadcn já tem `w-full`, mas adicionaremos larguras fixas nas colunas menores (Eixo, Var., St.) para melhor distribuição.
