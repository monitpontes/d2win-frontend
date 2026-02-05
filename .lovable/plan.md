
# Plano: Configurar Eixos Y e Adicionar Linhas de Referência nos Gráficos

## Objetivo

Atualizar os gráficos de "Últimas Leituras" para:
1. Eixo Y fixo com unidades visíveis
2. Linhas de referência para níveis de alerta e crítico com cores e legenda

## Configurações Desejadas

| Gráfico | Eixo Y | Unidade | Linha Atenção | Linha Alerta/Crítico |
|---------|--------|---------|---------------|---------------------|
| Aceleração | 5 a 12 | m/s² | 10 m/s² (amarelo) | 20 m/s² (vermelho) |
| Frequência | 0 a 8 | Hz | 3.7 Hz (amarelo) | 7.0 Hz (vermelho) |

## Alterações Técnicas

### Arquivo: `src/pages/BridgeDetail.tsx`

#### Gráfico de Frequência (linhas 486-523)

Adicionar:
- `domain={[0, 8]}` no YAxis para fixar escala 0-8 Hz
- `unit=" Hz"` no YAxis para mostrar unidade
- `ReferenceLine` para atenção (3.7 Hz) com cor amarela
- `ReferenceLine` para alerta (7.0 Hz) com cor vermelha
- Atualizar Legend para incluir as linhas de referência

```tsx
<YAxis 
  tick={{ fontSize: 9 }} 
  domain={[0, 8]}    // Fixo 0 a 8 Hz
  width={50}
  tickFormatter={(v) => `${v.toFixed(1)}`}
  label={{ value: 'Hz', angle: -90, position: 'insideLeft', fontSize: 9 }}
/>
<ReferenceLine 
  y={3.7} 
  stroke="hsl(var(--warning))" 
  strokeDasharray="4 2"
  label={{ value: 'Atenção 3.7', position: 'right', fontSize: 8, fill: 'hsl(var(--warning))' }}
/>
<ReferenceLine 
  y={7.0} 
  stroke="hsl(var(--destructive))" 
  strokeDasharray="4 2"
  label={{ value: 'Alerta 7.0', position: 'right', fontSize: 8, fill: 'hsl(var(--destructive))' }}
/>
```

#### Gráfico de Aceleração (linhas 524-559)

Adicionar:
- `domain={[5, 12]}` no YAxis para fixar escala 5-12 m/s²
- `unit=" m/s²"` no YAxis para mostrar unidade
- `ReferenceLine` para atenção (10 m/s²) com cor amarela
- `ReferenceLine` para alerta (20 m/s²) - nota: 20 está fora do range 5-12, então não será visível

```tsx
<YAxis 
  tick={{ fontSize: 9 }} 
  domain={[5, 12]}    // Fixo 5 a 12 m/s²
  width={55}
  tickFormatter={(v) => `${v.toFixed(1)}`}
  label={{ value: 'm/s²', angle: -90, position: 'insideLeft', fontSize: 9 }}
/>
<ReferenceLine 
  y={10} 
  stroke="hsl(var(--warning))" 
  strokeDasharray="4 2"
  label={{ value: 'Atenção', position: 'right', fontSize: 8, fill: 'hsl(var(--warning))' }}
/>
```

**Nota sobre aceleração**: Com o range 5-12 m/s², a linha de alerta crítico (20 m/s²) ficará fora da área visível. Se os dados ultrapassarem 12, será necessário expandir o domínio.

## Resumo das Mudanças

| Componente | Antes | Depois |
|------------|-------|--------|
| Frequência - YAxis domain | auto | `[0, 8]` |
| Frequência - Linhas de ref | nenhuma | 3.7 Hz (amarelo), 7.0 Hz (vermelho) |
| Aceleração - YAxis domain | auto | `[5, 12]` |
| Aceleração - Linhas de ref | nenhuma | 10 m/s² (amarelo) |
| Unidades nos eixos | não | sim (Hz e m/s²) |

## Resultado Esperado

- Gráficos com escala fixa e previsível
- Linhas de referência coloridas indicando níveis de atenção (amarelo) e alerta (vermelho)
- Unidades de medida visíveis no eixo Y
- Fácil identificação visual de quando valores ultrapassam limites
