

# Plano: Edição de Ponte Funcional e Status Real dos Dispositivos

## Resumo das Alterações

O usuário quer:
1. Editar informações da ponte no diálogo (já funciona, mas precisa validar)
2. Status estrutural NÃO é editável (remover o select)
3. Dispositivos mostrem status reais da telemetria (não "Offline" fixo)
4. Corrigir "Object]" na coluna Ponte dos dispositivos
5. Remover abas "Sensores" e "Usuários" do diálogo (já existem na aba de admin)
6. Upload de KMZ deve salvar no banco e aparecer no mapa

---

## Problema 1: "Object]" na coluna Ponte

Na tabela de dispositivos (Admin.tsx linha 518):
```typescript
<TableCell>{bridge?.name || (device.bridgeId ? String(device.bridgeId).slice(-8) : 'N/A')}</TableCell>
```

O `device.bridgeId` está vindo como objeto ao invés de string. Isso pode ocorrer se a API retornar um objeto populado. Precisamos garantir que seja sempre tratado como string.

**Solução**: Ajustar o mapeamento para extrair o ID corretamente e garantir fallback robusto.

---

## Problema 2: Status Fixo "Offline"

A tabela de dispositivos usa `device.status` que vem do banco de dados (cadastro), não da telemetria em tempo real. Para mostrar status reais:

**Solução**: Cruzar dados dos dispositivos com dados de telemetria por empresa usando `useTelemetryByCompany`.

---

## Problema 3: Remover Abas Desnecessárias do Diálogo

Atualmente o BridgeDetailsDialog tem 4 abas:
- Informações ✓ (manter)
- Sensores ✗ (remover - já existe em Dispositivos)
- Usuários ✗ (remover - já existe em Usuários)
- Mapa/KMZ ✓ (manter)

**Solução**: Alterar para grid de 2 colunas.

---

## Problema 4: Status Estrutural Não Editável

O campo "Status Estrutural" atualmente pode ser editado via Select. O usuário quer que seja apenas exibido (somente leitura).

**Solução**: Substituir o Select por um Badge de exibição.

---

## Problema 5: KMZ Salvar no Banco

Atualmente o campo KMZ aceita URL e salva via `handleSave`. A API já suporta `kmz_file`. Precisa apenas garantir que o campo seja salvo e que o mapa leia essa propriedade.

**Status**: Já funciona. O `handleSave` envia `kmz_file: formData.kmzFile`.

---

## Alterações Necessárias

### 1. `src/components/admin/BridgeDetailsDialog.tsx`

| Alteração | Descrição |
|-----------|-----------|
| Remover abas | Mudar de 4 para 2 abas (Informações, Mapa/KMZ) |
| Status Estrutural | Trocar Select por Badge somente leitura |
| Remover imports | Cpu, Users (ícones não usados) |
| Remover hooks | useUsers (não mais necessário) |

### 2. `src/pages/Admin.tsx`

| Alteração | Descrição |
|-----------|-----------|
| Cruzar dispositivos com telemetria | Usar `useTelemetryByCompany` para status real |
| Corrigir "Object]" | Tratar `bridgeId` como objeto ou string |

### 3. `src/lib/api/devices.ts`

| Alteração | Descrição |
|-----------|-----------|
| Tratar `bridge_id` | Extrair `_id` se vier como objeto populado |

---

## Código: BridgeDetailsDialog.tsx

```tsx
// Mudanças principais:

// 1. TabsList com 2 colunas
<TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="info">...</TabsTrigger>
  <TabsTrigger value="map">...</TabsTrigger>
</TabsList>

// 2. Status Estrutural como Badge (somente leitura)
<div className="space-y-2">
  <Label>Status Estrutural</Label>
  {getStatusBadge(formData.structuralStatus)}
  <p className="text-xs text-muted-foreground">
    Status determinado automaticamente pelo sistema de monitoramento
  </p>
</div>

// 3. Remover TabsContent de "sensors" e "users"
```

---

## Código: Admin.tsx - Dispositivos com Status Real

```tsx
// Adicionar hook de telemetria
const { data: telemetryData } = useTelemetryByCompany(selectedCompanyId || undefined);

// Criar mapa de status por deviceId
const telemetryStatusMap = useMemo(() => {
  const map = new Map<string, string>();
  telemetryData?.forEach(t => {
    map.set(t.deviceId, t.status || 'offline');
  });
  return map;
}, [telemetryData]);

// Na tabela de dispositivos:
<TableCell>
  {getStatusBadge(telemetryStatusMap.get(device.deviceId) || device.status)}
</TableCell>
```

---

## Código: devices.ts - Corrigir bridgeId

```typescript
export function mapApiDeviceToSensor(apiDevice: ApiDevice): Sensor {
  // Tratar bridge_id como objeto ou string
  const bridgeId = typeof apiDevice.bridge_id === 'object' && apiDevice.bridge_id !== null
    ? (apiDevice.bridge_id as any)._id || String(apiDevice.bridge_id)
    : apiDevice.bridge_id;

  return {
    id: apiDevice._id,
    deviceId: apiDevice.device_id || apiDevice.name,
    bridgeId: bridgeId,
    // ...resto igual
  };
}
```

---

## Sobre a API

Com base na estrutura atual:
- `PUT /bridges/:id` já aceita `kmz_file` como string URL
- `GET /devices-crud` retorna `bridge_id` que pode estar populado como objeto

**Não é necessário alterar a API** se `bridge_id` vier como string. Caso venha como objeto, o mapeamento no frontend irá tratar.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/BridgeDetailsDialog.tsx` | Remover abas Sensores/Usuários, Status Estrutural somente leitura |
| `src/pages/Admin.tsx` | Adicionar telemetria para status real dos dispositivos |
| `src/lib/api/devices.ts` | Tratar `bridge_id` como objeto ou string |

---

## Resultado Esperado

1. **Diálogo de ponte**: 2 abas (Informações, Mapa/KMZ)
2. **Status Estrutural**: Exibido como badge, não editável
3. **Tabela de dispositivos**: Status real da telemetria (Normal/Alerta/Crítico)
4. **Coluna Ponte**: Nome correto da ponte (não "Object]")
5. **KMZ**: Salvo no banco e exibido no mapa

