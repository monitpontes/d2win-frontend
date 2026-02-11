

# Corrigir graficos: filtro por tipo do sensor + linhas conectadas

## Problemas atuais

1. **Frequencia**: Aparece so pontos isolados sem linhas conectando-os. Cada sensor tem timestamps diferentes, criando gaps (`undefined`) entre pontos, e o Recharts nao desenha linha quando encontra `undefined`.

2. **Aceleracao**: Mesma situacao -- pontos soltos sem linhas, e aparecendo sensores que nao sao de aceleracao porque o filtro atual usa exclusao de `command_box` em vez de filtrar positivamente pelo tipo configurado.

3. **Ambos os graficos**: Devem mostrar apenas sensores configurados como o tipo correto no banco de dados (`device.type === 'frequency'` ou `device.type === 'acceleration'`).

## Solucao

### Arquivo: `src/components/dashboard/BridgeCard.tsx`

**Mudanca 1 -- Filtro por tipo do sensor (linhas 159-165)**

Voltar a filtrar positivamente por `device.type`:

```
validDeviceIds = devices onde type === 'frequency' (ou 'acceleration')
filtered = timeSeriesData onde type bate E deviceId esta nos validos
```

Com fallback: se nenhum device estiver cadastrado com aquele tipo, usa exclusao de `command_box` para nao mostrar grafico vazio.

**Mudanca 2 -- Adicionar `connectNulls` nas linhas (linhas 435 e 470)**

Adicionar `connectNulls={true}` nos componentes `<Line>` de ambos os graficos. Isso faz o Recharts desenhar linhas entre pontos do mesmo sensor mesmo quando ha timestamps intermediarios onde aquele sensor nao tem valor.

Antes:
```
<Line key={sensorId} type="monotone" dataKey={sensorId} stroke={...} strokeWidth={1.5} dot={{ r: 2 }} />
```

Depois:
```
<Line key={sensorId} type="monotone" dataKey={sensorId} stroke={...} strokeWidth={1.5} dot={{ r: 2 }} connectNulls={true} />
```

## Resumo das mudancas

| Local | O que muda |
|-------|-----------|
| L159-165 | Filtrar por `devices.filter(d => d.type === type)` em vez de excluir apenas command_box |
| L435 | Adicionar `connectNulls={true}` na Line de frequencia |
| L470 | Adicionar `connectNulls={true}` na Line de aceleracao |

A logica de "ultimos 10 pontos por sensor" e o eixo de tempo unificado permanecem inalterados.

