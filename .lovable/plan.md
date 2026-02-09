
# Plano: 4 Melhorias (Gráficos, Favicon, Scroll-to-Top, Sensor Click)

## 1. Gráficos com todos os sensores e legenda

### Problema
Os gráficos no BridgeCard mostram apenas uma linha genérica ("Freq Z" / "Acel Z") sem diferenciar por sensor.

### Solucao
Reestruturar os dados do gráfico para agrupar por `deviceId`, criando uma `Line` para cada sensor com cor distinta e legenda.

**Arquivo: `src/components/dashboard/BridgeCard.tsx`**

- No `chartData` (useMemo ~linha 152), agrupar `timeSeriesData` por `deviceId` em vez de juntar tudo numa única série
- Cada sensor terá sua própria chave no objeto de dados (ex: `Motiva_P1_S01`, `Motiva_P1_S03`)
- Gerar dinamicamente uma `<Line>` para cada sensor com cores distintas
- Adicionar `<Legend>` do Recharts para exibir os nomes dos sensores

```typescript
// Estrutura do chartData por sensor:
// [{ time: "09:54:03", Motiva_P1_S01: 3.48, Motiva_P1_S03: 3.50, ... }]

// Renderizar:
<Legend wrapperStyle={{ fontSize: 9 }} />
{sensorIds.map((sensorId, idx) => (
  <Line key={sensorId} dataKey={sensorId} stroke={COLORS[idx]} ... />
))}
```

Paleta de cores para as linhas (até 8 sensores):
```text
#4F8EF7, #34D399, #F59E0B, #EF4444, #8B5CF6, #EC4899, #06B6D4, #F97316
```

---

## 2. Favicon com o logo d2win-logo.ico

### Solucao
Copiar o arquivo `user-uploads://d2win-logo.ico` para `public/d2win-logo.ico` e atualizar `index.html` para apontar para ele.

**Arquivo: `index.html`**
- Linha 6: `<link rel="icon" type="image/x-icon" href="/d2win-logo.ico" />`
- Linha 7: `<link rel="shortcut icon" href="/d2win-logo.ico" />`

---

## 3. Botao Scroll-to-Top em todas as telas

### Solucao
Criar componente `ScrollToTop` que aparece quando o usuario rola a pagina para baixo, e ao clicar volta ao topo suavemente.

**Novo arquivo: `src/components/ui/scroll-to-top.tsx`**
- Monitora scroll do container pai (ou window)
- Mostra botao flutuante (canto inferior direito) quando `scrollY > 300`
- Usa icone `ChevronUp` do Lucide
- Animacao de fade-in/out

**Arquivo: `src/components/layout/MainLayout.tsx`**
- Adicionar `<ScrollToTop />` no layout principal para que apareca em todas as paginas

---

## 4. Clique na linha do sensor abre BridgeDetail com sensor selecionado

### Solucao
Ao clicar numa linha da tabela de sensores no BridgeCard, navegar para `/bridge/{id}?sensor={deviceId}`. Na BridgeDetail, ler o query param e selecionar o sensor automaticamente.

**Arquivo: `src/components/dashboard/BridgeCard.tsx`**
- Importar `useNavigate` do react-router-dom
- Adicionar `onClick` em cada `<TableRow>` da tabela de sensores:
  ```typescript
  <TableRow 
    key={idx} 
    className="h-8 cursor-pointer hover:bg-muted/50"
    onClick={() => navigate(`/bridge/${bridge.id}?sensor=${encodeURIComponent(reading.sensorName)}`)}
  >
  ```
- O botao "Ver detalhes" continua navegando sem query param (comportamento atual)

**Arquivo: `src/pages/BridgeDetail.tsx`**
- Importar `useSearchParams` do react-router-dom
- Ao montar, ler `searchParams.get('sensor')`
- Se existir, encontrar o sensor em `bridge3DSensors` pelo nome e chamar `setSelectedSensor3D(sensor)`
- Usar `useEffect` que depende de `bridge3DSensors` e do query param

```typescript
const [searchParams] = useSearchParams();

useEffect(() => {
  const sensorParam = searchParams.get('sensor');
  if (sensorParam && bridge3DSensors.length > 0 && !selectedSensor3D) {
    const found = bridge3DSensors.find(s => s.name === sensorParam || s.id === sensorParam);
    if (found) setSelectedSensor3D(found);
  }
}, [bridge3DSensors, searchParams]);
```

---

## Resumo dos Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `public/d2win-logo.ico` | Copiar favicon do upload |
| `index.html` | Atualizar href do favicon |
| `src/components/dashboard/BridgeCard.tsx` | Graficos multi-sensor + click na linha |
| `src/components/ui/scroll-to-top.tsx` | Novo componente scroll-to-top |
| `src/components/layout/MainLayout.tsx` | Adicionar ScrollToTop |
| `src/pages/BridgeDetail.tsx` | Ler query param `sensor` e selecionar |
