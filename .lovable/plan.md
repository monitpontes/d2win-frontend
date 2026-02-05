
# Plano: Corrigir Contagem de Sensores e Tipo do Dispositivo

## Problemas Identificados

### 1. Sensores: 0
O campo `bridge.sensorCount` vem da API como `0` porque o backend não está populando esse valor. A contagem precisa ser calculada dinamicamente no frontend contando quantos dispositivos estão associados a cada ponte.

### 2. Tipo do sensor sempre "Aceleração"
Na linha 540 do `Admin.tsx`, a lógica atual é:
```typescript
<TableCell>{device.type === 'frequency' ? 'Frequência' : 'Aceleração'}</TableCell>
```
Isso não trata o tipo `command_box` e mostra "Aceleração" como fallback para qualquer tipo que não seja "frequency".

## Solução

### Arquivo 1: `src/pages/Admin.tsx`

**Mudança A: Calcular `sensorCount` dinamicamente**

Criar um mapa de contagem de dispositivos por ponte usando os dados de `companyDevices`:

```typescript
// Após linha ~60 (hooks)
const deviceCountByBridge = useMemo(() => {
  const map = new Map<string, number>();
  companyDevices.forEach(device => {
    const count = map.get(device.bridgeId) || 0;
    map.set(device.bridgeId, count + 1);
  });
  return map;
}, [companyDevices]);
```

Na linha ~303 onde exibe `bridge.sensorCount`, usar o mapa:
```typescript
<p>
  <span className="font-medium">Sensores:</span> {deviceCountByBridge.get(bridge.id) || 0}
</p>
```

**Mudança B: Corrigir exibição do tipo do dispositivo**

Na linha 540, trocar a lógica ternária por uma função que mapeia todos os tipos:

```typescript
// Função helper (adicionar junto aos outros helpers)
const getDeviceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    frequency: 'Frequência',
    acceleration: 'Aceleração',
    command_box: 'Caixa de Comando',
  };
  return labels[type] || type;
};

// Na tabela de dispositivos (linha 540)
<TableCell>{getDeviceTypeLabel(device.type)}</TableCell>
```

## Visualização

### ANTES (Card da Ponte)
```text
┌─────────────────────────────────┐
│ OAE km 54+313         [Normal]  │
│ 65734c4c                        │
│                                 │
│ Local: N/A                      │
│ Sensores: 0           ← Errado  │
│ Atualizado: 05/02/2026          │
└─────────────────────────────────┘
```

### DEPOIS (Card da Ponte)
```text
┌─────────────────────────────────┐
│ OAE km 54+313         [Normal]  │
│ 65734c4c                        │
│                                 │
│ Local: N/A                      │
│ Sensores: 5           ← Correto │
│ Atualizado: 05/02/2026          │
└─────────────────────────────────┘
```

### ANTES (Tabela de Dispositivos)
```text
│ Motiva_P1_S01 │ OAE km... │ Aceleração     │ ← Sempre Aceleração
│ Motiva_P1_S02 │ OAE km... │ Aceleração     │
│ Motiva_P1_S03 │ OAE km... │ Aceleração     │
```

### DEPOIS (Tabela de Dispositivos)
```text
│ Motiva_P1_S01 │ OAE km... │ Frequência       │ ← Tipo real
│ Motiva_P1_S02 │ OAE km... │ Aceleração       │
│ Motiva_P1_S03 │ OAE km... │ Caixa de Comando │
```

## Resumo das Mudanças

| Local | Mudança |
|-------|---------|
| Admin.tsx (~L62) | Adicionar `useMemo` para `deviceCountByBridge` |
| Admin.tsx (~L303) | Usar `deviceCountByBridge.get(bridge.id)` em vez de `bridge.sensorCount` |
| Admin.tsx (~L122) | Adicionar função `getDeviceTypeLabel` |
| Admin.tsx (L540) | Usar `getDeviceTypeLabel(device.type)` |

## Seção Técnica

A contagem de sensores é feita no frontend porque:
1. O backend não popula o campo `sensorCount` corretamente
2. Temos os dispositivos já carregados via `useDevices`
3. O mapeamento é feito pelo `bridgeId` de cada device

Os tipos de sensor definidos em `src/types/index.ts` são:
- `acceleration` → "Aceleração"
- `frequency` → "Frequência"  
- `command_box` → "Caixa de Comando"
