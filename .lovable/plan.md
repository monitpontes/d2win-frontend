
# Plano: Sistema Completo de Gerenciamento de Pontes com Filtros Operacionais, Integração de Dados e Mapa KMZ

## Visão Geral

Este plano implementa um sistema robusto onde cada ponte gerencia seus próprios usuários, sensores e arquivos KMZ, com persistência de dados no banco de dados MongoDB através da API existente. O mapa interativo será integrado às pontes permitindo filtragem por clique.

---

## Funcionalidades a Implementar

### 1. Filtros Operacionais nas Configurações da Ponte
Adicionar todos os campos de filtros operacionais ao diálogo de detalhes da ponte (BridgeDetailsDialog), incluindo:
- Concessão
- Rodovia
- Tipologia (Ponte, Viaduto, Passarela)
- Material estrutural
- Tipo de vão
- Tipo de viga
- Status operacional
- Criticidade operacional
- KM
- Arquivo KMZ da ponte

### 2. Edição de Ponte com Persistência no Banco
Quando alterar campos da ponte no painel Admin:
- Atualizar o registro existente no banco (PUT/PATCH)
- Não criar registros duplicados
- Usar o hook `useBridges().updateBridge`

### 3. Usuários e Sensores por Ponte
- Listar usuários vinculados à ponte
- Listar sensores da ponte
- Permitir editar parâmetros dos sensores com persistência
- Usar os hooks `useDevices().updateDevice`

### 4. Arquivo KMZ por Ponte
- Cada ponte pode ter seu próprio arquivo KMZ
- Campo `kmzFile` na interface Bridge
- Upload de arquivo KMZ nas configurações
- Visualização no mapa

### 5. Mapa com Filtragem por Clique
- Ao clicar em um ponto no mapa, filtrar a ponte correspondente
- Mostrar pontes com coordenadas no mapa
- Carregar KMZ individual de cada ponte

---

## Arquivos a Modificar/Criar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/types/index.ts` | Modificar | Adicionar campo `kmzFile` à interface Bridge |
| `src/lib/api/bridges.ts` | Modificar | Mapear campo `kmz_file` da API |
| `src/components/admin/BridgeDetailsDialog.tsx` | Modificar | Adicionar campos de filtros operacionais e edição |
| `src/components/admin/DeviceParametersDialog.tsx` | Modificar | Integrar com API para persistência |
| `src/components/dashboard/BridgesMapLeaflet.tsx` | Modificar | Adicionar marcadores de pontes e callback de filtro |
| `src/pages/Dashboard.tsx` | Modificar | Receber callback do mapa para filtrar pontes |
| `src/hooks/useBridges.ts` | Verificar | Já tem `updateBridge` implementado |
| `src/hooks/useDevices.ts` | Verificar | Já tem `updateDevice` implementado |

---

## Seção Técnica Detalhada

### 1. Atualizar Interface Bridge

```typescript
// src/types/index.ts
export interface Bridge {
  // ... campos existentes
  kmzFile?: string; // URL do arquivo KMZ da ponte
}
```

### 2. Atualizar API de Bridges

```typescript
// src/lib/api/bridges.ts
export interface ApiBridge {
  // ... campos existentes
  kmz_file?: string;
}

export function mapApiBridgeToBridge(apiBridge: ApiBridge): Bridge {
  return {
    // ... mapeamento existente
    kmzFile: apiBridge.kmz_file,
  };
}
```

### 3. Novo BridgeDetailsDialog Completo

```typescript
// Estrutura do componente com abas
- Aba "Informações": dados básicos, filtros operacionais
- Aba "Sensores": lista de sensores da ponte, edição de parâmetros
- Aba "Usuários": lista de usuários com acesso
- Aba "Mapa": upload/visualização KMZ
```

Campos editáveis:
- `name`, `location`, `concession`, `rodovia`
- `typology`, `beamType`, `spanType`, `material`
- `structuralStatus`, `operationalCriticality`
- `km`, `length`, `width`, `capacity`
- `coordinates` (lat/lng)
- Upload de arquivo KMZ

### 4. Persistência nos Sensores

```typescript
// DeviceParametersDialog - handleSaveParams
const handleSaveParams = async () => {
  if (!device) return;
  
  await updateDevice({
    id: device.id,
    data: {
      acquisitionInterval: parseInt(params.acquisitionInterval),
      // ... outros campos
    }
  });
  
  toast.success('Parâmetros salvos!');
  onOpenChange(false);
};
```

### 5. Mapa com Pontes e Filtro

```typescript
// BridgesMapLeaflet - props atualizadas
interface BridgesMapProps {
  compact?: boolean;
  bridges?: Bridge[];
  onBridgeClick?: (bridgeId: string) => void;
}

// Adicionar marcadores de pontes
bridges.forEach(bridge => {
  if (bridge.coordinates) {
    const marker = L.marker([bridge.coordinates.lat, bridge.coordinates.lng], {
      icon: createBridgeIcon(bridge.structuralStatus)
    });
    
    marker.on('click', () => {
      onBridgeClick?.(bridge.id);
    });
    
    marker.bindPopup(`<strong>${bridge.name}</strong>`);
    bridgeMarkersLayer.addLayer(marker);
  }
});
```

### 6. Dashboard com Callback de Filtro

```typescript
// Dashboard.tsx
const handleBridgeClickOnMap = (bridgeId: string) => {
  setFilters(prev => ({
    ...prev,
    search: bridgeId // ou filtrar por ID específico
  }));
};

<BridgesMap 
  compact 
  bridges={allBridges}
  onBridgeClick={handleBridgeClickOnMap}
/>
```

---

## Fluxo de Atualização de Dados

```text
1. Usuário edita campo da ponte
          |
          v
2. Formulário valida dados
          |
          v
3. Chama updateBridge({ id, data })
          |
          v
4. Hook faz PUT /bridges/:id
          |
          v
5. API atualiza registro no MongoDB
          |
          v
6. React Query invalida cache
          |
          v
7. UI atualiza automaticamente
```

---

## Cores dos Marcadores no Mapa por Status

| Status | Cor |
|--------|-----|
| operacional | Verde (#22c55e) |
| atencao | Amarelo (#f59e0b) |
| restricoes | Laranja (#f97316) |
| critico | Vermelho (#ef4444) |
| interdicao | Vermelho escuro (#b91c1c) |

---

## Upload de Arquivo KMZ

Para armazenar o arquivo KMZ da ponte:
1. Usar campo de URL (armazenamento externo)
2. Ou fazer upload para um serviço de storage
3. Salvar a URL no campo `kmzFile`

O usuário pode fornecer uma URL direta ou, futuramente, integrar com um serviço de upload.

---

## Resultado Esperado

Ao final da implementação:
1. Cada ponte terá todos os filtros operacionais editáveis
2. Alterações serão salvas no banco de dados (não cria duplicatas)
3. Sensores da ponte serão listados e editáveis
4. Usuários vinculados à ponte serão exibidos
5. Cada ponte pode ter seu arquivo KMZ
6. Clicar no mapa filtra a ponte correspondente
7. Pontes com coordenadas aparecem no mapa com cores por status

---

## Estimativa

- **Tempo:** ~45 minutos
- **Arquivos:** 7-8 arquivos
- **Complexidade:** Média-Alta
