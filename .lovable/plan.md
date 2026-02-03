
# Plano de Integração com a D2WIN API

## Status: Fases 1-6 Implementadas ✅

---

## Resumo da Implementação

### Arquivos Criados

1. **`src/lib/api/client.ts`** - Cliente HTTP base com Axios e interceptors JWT
2. **`src/lib/api/auth.ts`** - Serviços de autenticação (login, getCurrentUser)
3. **`src/lib/api/companies.ts`** - CRUD de empresas
4. **`src/lib/api/bridges.ts`** - CRUD de pontes
5. **`src/lib/api/users.ts`** - CRUD de usuários
6. **`src/lib/api/devices.ts`** - CRUD de dispositivos
7. **`src/lib/api/telemetry.ts`** - Serviços de telemetria
8. **`src/lib/api/index.ts`** - Exportações centralizadas

9. **`src/hooks/useCompanies.ts`** - Hook React Query para empresas
10. **`src/hooks/useBridges.ts`** - Hook React Query para pontes
11. **`src/hooks/useUsers.ts`** - Hook React Query para usuários
12. **`src/hooks/useDevices.ts`** - Hook React Query para dispositivos

### Arquivos Modificados

1. **`src/contexts/AuthContext.tsx`** - Usa API real quando `VITE_API_URL` está configurada
2. **`src/components/admin/AdminSidebar.tsx`** - Conectado à API de empresas
3. **`src/components/layout/CompanySidebar.tsx`** - Conectado à API de empresas
4. **`src/pages/Admin.tsx`** - Conectado às APIs de pontes, usuários e dispositivos
5. **`src/pages/Dashboard.tsx`** - Conectado à API de pontes
6. **`src/pages/BridgeDetail.tsx`** - Conectado às APIs de ponte e dispositivos

---

## Funcionalidades Conectadas

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | ✅ | Login via `/auth/login`, validação via `/auth/me` |
| Empresas | ✅ | Listar, criar, editar, excluir |
| Pontes | ✅ | Listar por empresa, visualizar detalhes |
| Usuários | ✅ | Listar por empresa, criar, editar, excluir |
| Dispositivos | ✅ | Listar por empresa/ponte |
| Telemetria | ⏳ | Serviços criados, falta integrar nos gráficos |

---

## Comportamento do Sistema

### Com API Configurada (`VITE_API_URL` definida):
- Login usa endpoint real `/auth/login`
- Dados são buscados da API
- CRUD opera via API

### Sem API Configurada:
- Fallback para autenticação mock (senha: 0000)
- Estados de "sem dados" são exibidos
- Sistema continua funcional para demonstração

---

## Próximos Passos (Fase 7)

1. **Integrar telemetria nos gráficos** - Usar `telemetryService.getHistoryByBridge()` no `DataAnalysisSection`
2. **Conectar eventos/alertas** - Criar endpoint e hook para alertas
3. **Integrar câmeras** - Quando disponível na API
4. **Dashboard operacional** - Conectar KPIs com dados reais

---

## Configuração Necessária

```bash
# Adicionar no ambiente ou secrets do Lovable
VITE_API_URL=https://sua-api-url.vercel.app
```

A API precisa:
- Estar online e acessível
- Ter CORS configurado para aceitar requisições do frontend
- Usar autenticação JWT compatível

---

## Mapeamento de Tipos (API ↔ Frontend)

| Frontend | API |
|----------|-----|
| id | _id |
| companyId | company_id |
| bridgeId | bridge_id |
| status (active/inactive) | isActive (boolean) |

Os serviços em `src/lib/api/` fazem a conversão automaticamente.
