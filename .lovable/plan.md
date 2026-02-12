
# Corrigir layout cortado no Dashboard + Inputs de limites que nao editam

## Problema 1: Stats cards cortados na tela do admin

A imagem mostra que os 6 cards de status ("Total", "Operacional", "C/ Atencao", "C/ Restricoes", "Critico", "Interdicao") estao sendo cortados na lateral direita quando a sidebar de empresas esta visivel, porque o container pai nao tem `overflow-hidden` ou `min-w-0` para permitir que o grid encolha corretamente.

### Solucao

**Arquivo: `src/pages/Dashboard.tsx`**
- Adicionar `min-w-0` no `<main>` (linha 195) para que o flex child encolha corretamente quando a sidebar esta presente
- Adicionar `overflow-hidden` e `text-ellipsis truncate` nos textos dos labels dos stats cards para que nao estourem o container
- Reduzir gap e usar `min-w-0` nos items do grid

## Problema 2: Inputs de limites nao permitem editar o numero

O problema e classico de inputs controlados com `type="number"` e `value` numerico: quando o usuario tenta apagar o valor para digitar um novo, o `parseFloat("")` retorna `NaN`, que vira `0` imediatamente. O usuario nunca consegue limpar o campo.

### Solucao

**Arquivo: `src/components/admin/BridgeDetailsDialog.tsx`**
- Mudar o estado `limits` de numerico para string (linhas 63-68)
- Os inputs usam `value` como string diretamente, sem conversao imediata
- A conversao para numero so acontece no `handleSaveLimits` (no momento de enviar para a API)
- Isso permite que o usuario apague e digite livremente

Estado antes:
```
freqNormalToAlert: 3.7  (number)
```

Estado depois:
```
freqNormalToAlert: "3.7"  (string)
```

Os `onChange` passam a ser simples `e.target.value` sem `parseFloat` imediato. O `parseFloat` so ocorre no submit.

## Resumo

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Dashboard.tsx` | Adicionar `min-w-0` no main + truncar labels dos stats |
| `src/components/admin/BridgeDetailsDialog.tsx` | Trocar estado de limits para string para permitir edicao livre dos inputs numericos |
