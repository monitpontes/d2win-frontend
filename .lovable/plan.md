
# Plano: Alinhar Integração de API com Dashboard de Referência

## Resumo

Analisei o código do seu dashboard antigo (`d2win-dashboard`) e identifiquei diferenças importantes na forma como a API é consultada. A estrutura atual está correta, mas precisa de alguns ajustes para garantir compatibilidade total com a API do backend.

---

## O que encontrei no código de referência

O dashboard antigo usa um cliente de API com as seguintes características:

1. **Endpoints corretos**:
   - `/companies` - listagem de empresas
   - `/bridges?company_id=xxx` - pontes filtradas por empresa
   - `/devices-crud?company_id=xxx` - dispositivos
   - `/users?company_id=xxx` - usuários
   - `/auth/login` e `/auth/me` - autenticação

2. **Estrutura dos dados da API**:
   - Empresas: `{ _id, name, createdAt, updatedAt, isActive, abbr }`
   - Pontes: `{ _id, name, company_id, location, description, isActive, code }`
   - Dispositivos: `{ _id, device_id, company_id, bridge_id, isActive, last_seen, meta, params_current }`
   - Usuários: `{ _id, name, email, role, isActive, company_id }`

3. **Token**: Armazenado como `d2win_token` no localStorage

---

## Diagnóstico do Problema Atual

A integração está quase correta, mas há algumas discrepâncias:

| Aspecto | Dashboard Atual | Dashboard Referência | Status |
|---------|-----------------|----------------------|--------|
| Token key | `d2win_token` | `d2win_token` | OK |
| Endpoint empresas | `/companies` | `/companies` | OK |
| Endpoint pontes | `/bridges` | `/bridges` | OK |
| Endpoint dispositivos | `/devices-crud` | `/devices-crud` | OK |
| Mapeamento `_id` -> `id` | Implementado | - | OK |
| Tratamento de arrays vazios | Funciona | - | OK |

**Problema identificado**: A API está funcionando (login foi bem sucedido), mas provavelmente **não há dados cadastrados** na API para empresas e pontes.

---

## Plano de Verificação e Ajustes

### Fase 1: Adicionar Logs de Debug (Temporário)

Adicionar console.log nas chamadas de API para verificar:
- URL sendo chamada
- Resposta recebida
- Erros detalhados

**Arquivos a modificar**:
- `src/lib/api/companies.ts`
- `src/lib/api/bridges.ts`

### Fase 2: Melhorar Tratamento de Erros

Adicionar tratamento mais robusto para:
- Erros de rede
- Respostas vazias
- Timeout de API (cold start do Render)

**Arquivos a modificar**:
- `src/lib/api/client.ts`
- `src/hooks/useCompanies.ts`
- `src/hooks/useBridges.ts`

### Fase 3: Criar Ferramenta de Teste de API

Adicionar botão temporário para testar conexão com a API diretamente:
- Testar GET `/companies`
- Testar GET `/bridges`
- Mostrar resposta raw no console

---

## Seção Técnica

### Alterações no `src/lib/api/client.ts`

```typescript
// Adicionar timeout maior para cold start do Render
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 segundos para cold start
});

// Melhorar log de debug
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.url}`, error.response?.data || error.message);
    // ... resto do tratamento
  }
);
```

### Alterações em `src/lib/api/companies.ts`

```typescript
export async function getCompanies(): Promise<Company[]> {
  try {
    const response = await api.get<ApiCompany[]>('/companies');
    console.log('[Companies] Raw response:', response.data);
    return response.data.map(mapApiCompanyToCompany);
  } catch (error) {
    console.error('[Companies] Error fetching:', error);
    throw error;
  }
}
```

### Alterações em `src/hooks/useCompanies.ts`

```typescript
const { 
  data: companies = [], 
  isLoading, 
  error,
  refetch 
} = useQuery({
  queryKey: ['companies'],
  queryFn: companiesService.getCompanies,
  staleTime: 5 * 60 * 1000,
  retry: 2, // Tentar 2 vezes em caso de falha
  retryDelay: 1000, // Esperar 1s entre tentativas
});
```

---

## Próximos Passos Após Implementação

1. **Fazer login novamente** e observar os logs no console (F12)
2. **Verificar se as chamadas estão sendo feitas** para `/companies` e `/bridges`
3. **Analisar a resposta** - se retorna `[]` vazio, o problema é que não há dados na API
4. **Se necessário**, cadastrar uma empresa de teste via painel Admin

---

## Estimativa

- **Fase 1**: 5 minutos
- **Fase 2**: 5 minutos
- **Fase 3**: 10 minutos (opcional)
- **Total**: ~15-20 minutos
