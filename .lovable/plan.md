
# Plano: Melhorias Completas no Painel Administrativo e Dashboard

## Resumo das Alterações

O usuário solicitou várias melhorias importantes:
1. **Criação de Ponte com Sensores Automáticos** - Ao criar uma ponte, especificar número de sensores e criar automaticamente os devices
2. **Cadastro Completo de Empresa** - Adicionar campos de contato, email, telefone (como cadastro de cliente)
3. **Remover Dados Mock** - Se não há dados da API, exibir vazio ao invés de dados fictícios
4. **Eixo Dinâmico** - Mostrar apenas eixo Z por padrão, mas se o meta indicar outro eixo, adicionar os outros
5. **RBAC** - Manter a estrutura de permissões segura

---

## 1. Cadastro Completo de Empresa (Cliente)

### Alterações Necessárias

**Arquivo: `src/types/index.ts`**
Expandir interface Company com campos de contato:

```typescript
export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  // Novos campos de cadastro
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

**Arquivo: `src/lib/api/companies.ts`**
Atualizar interface ApiCompany e mapeamento:

```typescript
export interface ApiCompany {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt?: string;
  // Novos campos
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface CreateCompanyData {
  name: string;
  description?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

**Arquivo: `src/components/admin/AdminSidebar.tsx`**
Expandir dialog de criação/edição de empresa com formulário completo:
- Abas: Informações Básicas | Contato | Endereço
- Campos: CNPJ, Email, Telefone, Endereço, Cidade, Estado, CEP
- Contato responsável: Nome, Email, Telefone

---

## 2. Criação de Ponte com Sensores Automáticos

### Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────┐
│                   Dialog "Nova Ponte"                        │
│                                                              │
│  Nome: [_________________________]                          │
│  Localização: [__________________]                          │
│  Rodovia: [______________________]                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Quantidade de Sensores                              │   │
│  │                                                       │   │
│  │  Frequência: [___] sensores                          │   │
│  │  Aceleração: [___] sensores                          │   │
│  │                                                       │   │
│  │  Total: 4 dispositivos serão criados automaticamente │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│                        [Cancelar]  [Criar Ponte e Sensores] │
└─────────────────────────────────────────────────────────────┘
```

### Lógica de Criação

**Arquivo: `src/pages/Admin.tsx`**
Atualizar dialog de nova ponte:

```typescript
const [newBridgeForm, setNewBridgeForm] = useState({
  name: '',
  location: '',
  rodovia: '',
  frequencySensorCount: 0,
  accelerationSensorCount: 0,
});

const handleCreateBridgeWithSensors = async () => {
  // 1. Criar a ponte
  const bridge = await bridgesService.createBridge({
    name: newBridgeForm.name,
    company_id: selectedCompanyId,
    location: newBridgeForm.location,
    rodovia: newBridgeForm.rodovia,
  });

  // 2. Criar sensores de frequência
  for (let i = 1; i <= newBridgeForm.frequencySensorCount; i++) {
    await devicesService.createDevice({
      bridge_id: bridge.id,
      company_id: selectedCompanyId,
      type: 'frequency',
      name: `FREQ-${bridge.id.slice(-4)}-${i}`,
      status: 'offline',
    });
  }

  // 3. Criar sensores de aceleração
  for (let i = 1; i <= newBridgeForm.accelerationSensorCount; i++) {
    await devicesService.createDevice({
      bridge_id: bridge.id,
      company_id: selectedCompanyId,
      type: 'acceleration',
      name: `ACCEL-${bridge.id.slice(-4)}-${i}`,
      status: 'offline',
    });
  }

  toast.success(`Ponte e ${total} sensores criados com sucesso!`);
};
```

**Arquivo: `src/hooks/useBridges.ts`**
Adicionar função que retorna a ponte criada para encadeamento:

```typescript
const createBridgeAsync = async (data: Partial<ApiBridge>): Promise<Bridge> => {
  return bridgesService.createBridge(data);
};
```

---

## 3. Remover Dados Mock

### Arquivos a Modificar

**Arquivo: `src/components/bridge/DataAnalysisSection.tsx`**

Atualmente (linhas 139-167):
```typescript
// Fallback mock only if no data
return Array.from({ length: 30 }, (_, i) => ({...}));
```

Mudar para:
```typescript
// Se não há dados, retorna array vazio
if (!timeSeriesData || timeSeriesData.length === 0) {
  return [];
}
```

E adicionar estado de "sem dados" nos gráficos:
```typescript
{timeSeriesAcceleration.length === 0 ? (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    <span>Sem dados de aceleração disponíveis</span>
  </div>
) : (
  <ResponsiveContainer>...</ResponsiveContainer>
)}
```

**Arquivo: `src/components/dashboard/BridgeCard.tsx`**

Atualmente (linhas 97-110):
```typescript
// Fallback mock data if no telemetry
const times = ['10:03:00', ...];
return { frequency: times.map(...), acceleration: times.map(...) };
```

Mudar para:
```typescript
if (!timeSeriesData || timeSeriesData.length === 0) {
  return { frequency: [], acceleration: [] };
}
```

---

## 4. Eixo Dinâmico (Z por padrão, outros se indicado)

### Conceito

O backend pode enviar no `meta` qual eixo está sendo utilizado. Se não especificado, assume Z. Se especificado diferente, exibe os eixos disponíveis.

**Arquivo: `src/lib/api/telemetry.ts`**

Atualizar interface para incluir eixo:
```typescript
interface ApiHistoryAccelReading {
  ts: string;
  value: number;
  severity: string;
  meta?: { 
    device_id: string;
    axis?: 'x' | 'y' | 'z';  // Novo campo
  };
}
```

Atualizar mapeamento:
```typescript
export interface TelemetryTimeSeriesPoint {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  severity?: string;
  axis?: 'x' | 'y' | 'z';  // Novo campo
}

// Na função getHistoryTimeSeries:
item.accel?.forEach(reading => {
  const axis = reading.meta?.axis || 'z';  // Default Z
  points.push({
    deviceId: item.device_id,
    bridgeId,
    timestamp: reading.ts,
    type: 'acceleration',
    value: reading.value,
    severity: reading.severity,
    axis,  // Incluir eixo
  });
});
```

**Arquivo: `src/components/bridge/DataAnalysisSection.tsx`**

Detectar eixos disponíveis nos dados:
```typescript
const availableAxes = useMemo(() => {
  if (!timeSeriesData?.length) return ['Z'];
  
  const axes = new Set<string>();
  timeSeriesData
    .filter(d => d.type === 'acceleration')
    .forEach(d => axes.add((d.axis || 'z').toUpperCase()));
  
  return Array.from(axes).length > 0 ? Array.from(axes) : ['Z'];
}, [timeSeriesData]);

// Filtrar opções de eixo no Select
<Select value={accelAxisFilter}>
  <SelectContent>
    {availableAxes.includes('X') && <SelectItem value="X">Eixo X</SelectItem>}
    {availableAxes.includes('Y') && <SelectItem value="Y">Eixo Y</SelectItem>}
    {availableAxes.includes('Z') && <SelectItem value="Z">Eixo Z</SelectItem>}
    {availableAxes.length > 1 && <SelectItem value="Todos">Todos</SelectItem>}
  </SelectContent>
</Select>
```

---

## 5. RBAC - Manter Estrutura Segura

### Estado Atual

O sistema já implementa RBAC via backend:
- Autenticação via JWT (`d2win_token`)
- Roles: `viewer`, `gestor`, `admin`
- Validação via `/auth/me`
- Função `hasRole()` no AuthContext

### Pontos a Manter/Reforçar

1. **Nunca validar roles no frontend** - Apenas ocultar UI, validação real no backend
2. **CRUD de usuários** - Já usa endpoint `/users` com validação de permissões no backend
3. **Criação de empresa/ponte** - Adicionar verificação `hasRole('admin')` antes das ações

```typescript
// Verificar permissão antes de ações críticas
const handleCreateBridge = () => {
  if (!hasRole('admin') && !hasRole('gestor')) {
    toast.error('Você não tem permissão para criar pontes');
    return;
  }
  // ... prosseguir com criação
};
```

4. **Ocultar botões por role**:
```typescript
{hasRole('admin') && (
  <Button onClick={() => setIsNewBridgeOpen(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Nova Ponte
  </Button>
)}
```

---

## Resumo de Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/index.ts` | Expandir interface Company com campos de contato |
| `src/lib/api/companies.ts` | Atualizar ApiCompany e funções de create/update |
| `src/hooks/useCompanies.ts` | Atualizar tipos de criação |
| `src/components/admin/AdminSidebar.tsx` | Formulário completo para cadastro de empresa |
| `src/pages/Admin.tsx` | Dialog de nova ponte com sensores automáticos |
| `src/lib/api/telemetry.ts` | Adicionar campo axis ao TelemetryTimeSeriesPoint |
| `src/components/bridge/DataAnalysisSection.tsx` | Remover mock, eixos dinâmicos |
| `src/components/dashboard/BridgeCard.tsx` | Remover mock data |

---

## Seção Técnica

### Interface Company Expandida

```typescript
// types/index.ts
export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  // Cadastro do cliente
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Contato responsável
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

### Dialog Nova Ponte com Sensores

```typescript
// Admin.tsx - Nova estrutura do form
const [newBridgeForm, setNewBridgeForm] = useState({
  name: '',
  location: '',
  rodovia: '',
  typology: 'Ponte' as BridgeTypology,
  frequencySensorCount: 2,
  accelerationSensorCount: 2,
});

const totalSensors = newBridgeForm.frequencySensorCount + newBridgeForm.accelerationSensorCount;
```

### Detecção de Eixos

```typescript
// telemetry.ts - Expandir ponto com axis
export interface TelemetryTimeSeriesPoint {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  severity?: string;
  axis?: 'x' | 'y' | 'z';  // Default 'z' se não especificado
}
```

---

## Fluxo de Criação de Ponte com Sensores

```text
1. Admin clica em "Nova Ponte"
   └── Dialog abre com campos:
       ├── Nome
       ├── Localização  
       ├── Rodovia
       ├── Tipologia (Ponte/Viaduto/Passarela)
       └── Quantidade de Sensores:
           ├── Frequência: [input numérico]
           └── Aceleração: [input numérico]

2. Admin preenche e clica "Criar"
   └── Frontend:
       ├── Valida campos
       ├── Chama POST /bridges (cria ponte)
       └── Loop para cada sensor:
           └── Chama POST /devices-crud (cria device)

3. Backend:
   ├── Valida permissões (RBAC)
   ├── Cria ponte no MongoDB
   └── Cria devices vinculados à ponte

4. Sucesso:
   └── Toast: "Ponte e 4 sensores criados com sucesso!"
```

---

## Estimativa

- **Tempo:** ~90 minutos
- **Arquivos a modificar:** 8
- **Novos campos de API:** Campos de empresa (backend precisa suportar)
- **Complexidade:** Média

