
# Plano: Mostrar Nome da OAE Diretamente do Banco de Dados

## Problema Identificado

Na linha 299 do arquivo `src/pages/BridgeDetail.tsx`, o nome da ponte está sendo exibido com formatação e valores aleatórios:

```tsx
<h1 className="text-xl font-bold">OAE km {bridge.km}+{Math.floor(Math.random() * 999)} ({bridge.name} - {bridge.rodovia})</h1>
```

Isso resulta em nomes confusos como:
- "OAE km 0+90 (OAE km 54+313 (SP-348 - Rodovia dos Bandeirantes) - )"

## Solução

Simplificar para mostrar apenas o nome armazenado no banco de dados:

### Antes:
```tsx
<h1 className="text-xl font-bold">OAE km {bridge.km}+{Math.floor(Math.random() * 999)} ({bridge.name} - {bridge.rodovia})</h1>
<p className="text-sm text-muted-foreground">ID: {bridge.id.replace('bridge-', 'A-P')}</p>
```

### Depois:
```tsx
<h1 className="text-xl font-bold">{bridge.name}</h1>
<p className="text-sm text-muted-foreground">ID: {bridge.id}</p>
```

## Detalhes Técnicos

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/pages/BridgeDetail.tsx` | 299 | Substituir formatação complexa por `{bridge.name}` |
| `src/pages/BridgeDetail.tsx` | 301 | Remover `.replace('bridge-', 'A-P')` do ID |

## Resultado Esperado

- Nome exibido exatamente como está no banco de dados
- ID exibido exatamente como está no banco de dados (ex: `68b9e38a69deabb365734c4c`)
- Sem valores aleatórios que mudam a cada render
