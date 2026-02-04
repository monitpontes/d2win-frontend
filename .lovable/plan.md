

# Plano: Corrigir Erro "ID da empresa é obrigatório" na Atualização de Ponte

## Problema Identificado

O erro **"ID da empresa é obrigatório"** ocorre porque a função `handleSave` no `BridgeDetailsDialog.tsx` não está enviando o campo `company_id` na requisição de atualização.

### Análise do Código Atual

No `BridgeDetailsDialog.tsx` linha 103-125:
```typescript
const handleSave = () => {
  updateBridge({
    id: bridge.id,
    data: {
      name: formData.name,
      location: formData.location,
      // ... outros campos
      // ⚠️ FALTA: company_id NÃO está sendo enviado!
    }
  });
};
```

A API no backend exige `company_id` como campo obrigatório, provavelmente em validação do controller ou schema do modelo.

---

## Solução

### 1. Adicionar `company_id` ao payload de atualização

O `bridge` recebido como prop já contém `companyId`. Basta incluí-lo no payload:

```typescript
const handleSave = () => {
  updateBridge({
    id: bridge.id,
    data: {
      company_id: bridge.companyId, // ← ADICIONAR ESTE CAMPO
      name: formData.name,
      location: formData.location,
      concession: formData.concession,
      // ... resto dos campos
    }
  });
};
```

---

## Verificação da API

Baseado na estrutura do código:

| Endpoint | Método | Campos Obrigatórios |
|----------|--------|---------------------|
| `PUT /bridges/:id` | Atualizar ponte | `company_id`, `name` |

A API já suporta todos os campos atuais (`beamType`, `spanType`, `material`, `kmz_file`, etc.). O único problema é a falta do `company_id` no payload.

### Interface ApiBridge (já definida corretamente)

```typescript
export interface ApiBridge {
  _id: string;
  name: string;
  company_id: string;  // ← Campo obrigatório
  location?: string;
  concession?: string;
  rodovia?: string;
  typology?: BridgeTypology;
  km?: number;
  beamType?: string;
  spanType?: string;
  material?: string;
  length?: number;
  width?: number;
  // ... outros campos opcionais
}
```

---

## Alteração Necessária

### Arquivo: `src/components/admin/BridgeDetailsDialog.tsx`

Modificar a função `handleSave` (linhas 103-125) para incluir `company_id`:

```typescript
const handleSave = () => {
  updateBridge({
    id: bridge.id,
    data: {
      company_id: bridge.companyId,  // ← ADICIONAR
      name: formData.name,
      location: formData.location,
      concession: formData.concession,
      rodovia: formData.rodovia,
      typology: formData.typology,
      beamType: formData.beamType,
      spanType: formData.spanType,
      material: formData.material,
      km: formData.km,
      length: formData.length,
      width: formData.width || undefined,
      capacity: formData.capacity || undefined,
      constructionYear: formData.constructionYear || undefined,
      operationalCriticality: formData.operationalCriticality,
      kmz_file: formData.kmzFile || undefined,
      coordinates: formData.lat && formData.lng 
        ? { lat: formData.lat, lng: formData.lng } 
        : undefined,
    }
  });
};
```

---

## Sobre os Models da API

Com base no código atual, a API parece ter um modelo MongoDB com validação:

```javascript
// Provável estrutura do modelo na API
const bridgeSchema = new Schema({
  name: { type: String, required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  location: String,
  concession: String,
  rodovia: String,
  typology: { type: String, enum: ['Ponte', 'Viaduto', 'Passarela'] },
  km: Number,
  beamType: String,
  spanType: String,
  material: String,
  length: Number,
  width: Number,
  constructionYear: Number,
  capacity: Number,
  operationalCriticality: { type: String, enum: ['low', 'medium', 'high'] },
  structuralStatus: { type: String, enum: ['operacional', 'atencao', 'restricoes', 'critico', 'interdicao'] },
  coordinates: {
    lat: Number,
    lng: Number
  },
  kmz_file: String,
  // ... outros campos
});
```

**Não é necessário alterar a API** - todos os campos já estão suportados. O problema é apenas que o frontend não estava enviando `company_id`.

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/BridgeDetailsDialog.tsx` | Adicionar `company_id: bridge.companyId` no payload do `handleSave` |

---

## Resultado Esperado

- ✅ Salvar alterações da ponte sem erro
- ✅ Todos os campos (nome, localização, tipologia, KMZ, coordenadas, etc.) serão persistidos
- ✅ Status estrutural permanece somente leitura (determinado pelo sistema)

