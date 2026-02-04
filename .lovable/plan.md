

# Plano: Limitar Gráfico a Exatamente 8 Leituras

## Situação Atual

O gráfico no painel de detalhes do sensor **já está configurado** para mostrar apenas as últimas 8 leituras:

```tsx
// src/pages/BridgeDetail.tsx - Linha 474-477
<LineChart data={
  timeSeriesData
    .filter(point => point.deviceId === currentSelectedSensor.id)
    .slice(-8)  // ← Já pega os 8 últimos
    ...
}>
```

### O que pode estar acontecendo?

Se você está vendo mais de 8 pontos, pode ser por:
1. **WebSocket adicionando dados** entre renders
2. **API retornando muitos pontos** (100) que são processados antes do slice

---

## Solução Proposta

Para garantir que apareçam **exatamente os 8 mais recentes** de forma consistente, vamos:

1. **Manter o slice(-8) no gráfico** (já existe)
2. **Adicionar ordenação por timestamp** antes do slice para garantir ordem correta

### Alteração no Código

**Arquivo:** `src/pages/BridgeDetail.tsx` (linhas 474-482)

Modificar de:
```tsx
<LineChart data={
  timeSeriesData
    .filter(point => point.deviceId === currentSelectedSensor.id)
    .slice(-8)
    .map(point => ({...}))
}>
```

Para:
```tsx
<LineChart data={
  timeSeriesData
    .filter(point => point.deviceId === currentSelectedSensor.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-8)  // Últimos 8 após ordenação
    .map(point => ({...}))
}>
```

Isso garante que:
- Os dados sejam primeiro ordenados cronologicamente
- Depois pegamos os 8 mais recentes
- O gráfico sempre mostra exatamente 8 pontos ordenados

---

## Resultado Esperado

- Gráfico mostra **exatamente 8 leituras**
- Dados sempre ordenados por tempo (mais antigo → mais recente)
- Novos dados do WebSocket substituem os mais antigos

