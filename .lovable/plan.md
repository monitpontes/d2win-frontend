

# Tela de carregamento completa + Responsividade para todos os formatos de tela

## Parte 1: Carregamento completo antes de exibir conteudo

### Dashboard (`src/pages/Dashboard.tsx`)
- Atualmente ja tem um loading state baseado em `isLoading` dos bridges, mas o mapa, graficos e cards aparecem antes de todos os dados estarem prontos
- Manter o loading spinner existente como esta (ja funciona bem para o caso principal)
- Nenhuma mudanca necessaria aqui -- o `isLoading` do `useBridges` ja controla a exibicao

### BridgeDetail (`src/pages/BridgeDetail.tsx`)
- Atualmente so espera `isLoadingBridge` (dados da ponte), mas os sensores (`useDevices`) e telemetria (`useTelemetry`) carregam depois, causando graficos vazios e dados parciais
- Adicionar verificacao de `isLoading` dos hooks `useDevices` e `useTelemetry` 
- Criar um estado unificado `isPageLoading = isLoadingBridge || isDevicesLoading || isTelemetryLoading`
- Mostrar o spinner de carregamento ate que TODOS os dados estejam prontos
- Isso resolve graficos aparecendo vazios e dados "-" temporarios

**Mudancas no arquivo:**
- Linha 82-83: Adicionar destructuring dos `isLoading` de devices e telemetry
- Linha 224-231: Trocar condicao de `isLoadingBridge` para `isPageLoading` (combinacao dos 3 loadings)

### BridgeCard (`src/components/dashboard/BridgeCard.tsx`)
- Ja implementa loading unificado (`isDataLoading = isDevicesLoading || isTelemetryLoading`) com skeleton -- sem mudancas necessarias

---

## Parte 2: Responsividade para diferentes formatos de tela

### Header (`src/components/layout/Header.tsx`)
- Titulo "d2win - Monitoramento Estrutural" esta cortado em telas menores (visivel na imagem do usuario)
- Reduzir fonte do titulo em telas menores: `text-sm md:text-xl`
- Esconder texto longo em mobile, mostrar so "d2win" ou so o logo
- Tornar navegacao mais compacta em telas menores

**Mudancas:**
- L36: Texto do logo -- esconder "- Monitoramento Estrutural" em mobile com `hidden md:inline`
- L41-53: Botoes de navegacao -- reduzir padding e esconder texto em mobile, mantendo so icones

### Dashboard (`src/pages/Dashboard.tsx`)
- Stats cards: mudar grid de `grid-cols-3 lg:grid-cols-6` para `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Reduzir tamanho dos numeros e icones em mobile: `text-2xl md:text-3xl` nos valores, `h-8 w-8 md:h-12 md:w-12` nos icones
- Padding dos cards: `p-3 md:p-5`
- Area do mapa + KPI: ja e `grid-cols-1 lg:grid-cols-4`, OK
- Titulo: reduzir fonte `text-lg md:text-xl`

### BridgeDetail (`src/pages/BridgeDetail.tsx`)
- Tabs: em telas menores, os nomes das abas ficam cortados. Reduzir fonte e usar nomes curtos
- Tab triggers: adicionar `text-xs md:text-sm` e truncar texto
- Grid de sensores: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` em vez de fixo em 5
- Header da ponte: empilhar verticalmente em mobile (status badge abaixo do nome)

**Mudancas:**
- L336-368: Header -- empilhar flex em mobile com `flex-col md:flex-row`
- L373-389: TabsList -- texto menor com `text-xs md:text-sm`, abreviar nomes em mobile
- L649: Grid de sensores -- responsivo com `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`

### DashboardCharts (`src/components/dashboard/DashboardCharts.tsx`)
- Grid: `grid-cols-1 md:grid-cols-3` (ja esta OK)
- Altura dos graficos: manter `h-[170px]`

### CompanySidebar (`src/components/layout/CompanySidebar.tsx`)
- Em mobile deveria iniciar colapsada
- Sem mudanca agora, manter comportamento atual (ja tem botao de colapsar)

---

## Resumo de arquivos a editar

| Arquivo | Mudancas |
|---------|----------|
| `src/pages/BridgeDetail.tsx` | Loading unificado (bridge + devices + telemetry); responsividade do header, tabs e grid de sensores |
| `src/pages/Dashboard.tsx` | Responsividade dos stats cards (grid, fontes, padding) |
| `src/components/layout/Header.tsx` | Esconder texto longo em mobile, compactar navegacao |

