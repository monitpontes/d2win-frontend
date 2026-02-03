
# Plano de Integração com a D2WIN API

## Resumo

Integrar o dashboard com a API existente em `d2win-api`, substituindo os dados mock por chamadas reais ao backend. A API usa MongoDB, autenticação JWT, e está estruturada com endpoints REST para empresas, pontes, dispositivos, usuários e telemetria.

---

## Arquitetura da Integração

```text
+------------------+       +------------------+       +------------------+
|   Frontend       |  -->  |   API Service    |  -->  |   D2WIN API      |
|   (React)        |       |   (src/lib/api)  |       |   (Express/Mongo)|
+------------------+       +------------------+       +------------------+
        |                         |
        v                         v
   AuthContext             localStorage (JWT)
```

---

## Endpoints da API Identificados

| Recurso | Metodo | Endpoint | Descricao |
|---------|--------|----------|-----------|
| Auth | POST | /auth/login | Login com email/senha, retorna JWT |
| Auth | GET | /auth/me | Retorna usuario atual pelo token |
| Companies | GET | /companies | Lista empresas ativas |
| Companies | POST | /companies | Cria nova empresa |
| Companies | PUT | /companies/:id | Atualiza empresa |
| Companies | DELETE | /companies/:id | Remove empresa (soft delete) |
| Bridges | GET | /bridges?company_id= | Lista pontes por empresa |
| Bridges | GET | /bridges/:id | Detalhes de uma ponte |
| Bridges | POST | /bridges | Cria ponte + devices automaticos |
| Bridges | PUT | /bridges/:id | Atualiza ponte |
| Bridges | DELETE | /bridges/:id | Remove ponte |
| Users | GET | /users?company_id= | Lista usuarios |
| Users | POST | /users | Cria usuario |
| Users | PUT | /users/:id | Atualiza (nome, role, isActive, senha) |
| Users | DELETE | /users/:id | Remove usuario |
| Devices | GET | /devices-crud?company_id=&bridge_id= | Lista dispositivos |
| Devices | POST | /devices-crud | Cria dispositivo |
| Devices | PUT | /devices-crud/:id | Atualiza parametros |
| Devices | DELETE | /devices-crud/:id | Remove dispositivo |
| Telemetry | GET | /telemetry/latest/company/:id | Ultimos dados da empresa |
| Telemetry | GET | /telemetry/latest/bridge/:id | Ultimos dados da ponte |
| Telemetry | GET | /telemetry/history/bridge/:id | Historico para graficos |
| Alerts | GET | /alerts | Lista alertas |

---

## Fases de Implementacao

### Fase 1: Infraestrutura Base
- Criar camada de servicos API em `src/lib/api/`
- Configurar cliente HTTP com interceptors para JWT
- Criar hook de configuracao da API URL
- Atualizar AuthContext para usar API real

### Fase 2: Autenticacao Real
- Integrar login com `/auth/login`
- Armazenar JWT no localStorage/sessionStorage
- Implementar `/auth/me` para validar sessao
- Adicionar refresh de token automatico

### Fase 3: Modulo de Empresas
- Listar empresas da API
- Criar, editar e excluir empresas
- Atualizar AdminSidebar com dados reais

### Fase 4: Modulo de Pontes
- Listar pontes por empresa
- CRUD completo de pontes
- Atualizar Dashboard e Admin

### Fase 5: Modulo de Usuarios
- Listar usuarios por empresa
- CRUD com alteracao de role e status
- Atualizar aba Usuarios do Admin

### Fase 6: Modulo de Dispositivos
- Listar dispositivos com filtros
- Atualizar parametros de configuracao
- Integrar dialog de parametros

### Fase 7: Telemetria e Graficos
- Buscar dados recentes por ponte
- Historico para graficos
- Atualizar Dashboard de monitoramento

---

## Detalhes Tecnicos

### Arquivos a Criar

1. `src/lib/api/client.ts` - Cliente HTTP base com Axios
2. `src/lib/api/auth.ts` - Servicos de autenticacao
3. `src/lib/api/companies.ts` - Servicos de empresas
4. `src/lib/api/bridges.ts` - Servicos de pontes
5. `src/lib/api/users.ts` - Servicos de usuarios
6. `src/lib/api/devices.ts` - Servicos de dispositivos
7. `src/lib/api/telemetry.ts` - Servicos de telemetria
8. `src/lib/api/index.ts` - Exportacoes centralizadas
9. `src/hooks/useApiConfig.ts` - Hook para URL da API

### Arquivos a Modificar

1. `src/contexts/AuthContext.tsx` - Usar API real para login
2. `src/components/admin/AdminSidebar.tsx` - Carregar empresas da API
3. `src/pages/Admin.tsx` - Substituir mock por chamadas API
4. `src/pages/Dashboard.tsx` - Buscar pontes e dados reais
5. `src/pages/BridgeDetail.tsx` - Buscar dados da ponte
6. `src/types/index.ts` - Ajustar tipos para formato da API

### Estrutura do Cliente HTTP

```typescript
// src/lib/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://sua-api.vercel.app';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('d2win_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('d2win_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Mapeamento de Tipos (API para Frontend)

A API usa campos diferentes do frontend atual:

| Frontend | API |
|----------|-----|
| id | _id |
| companyId | company_id |
| bridgeId | bridge_id |
| status | isActive |

Sera criado um utilitario de mapeamento para converter os formatos automaticamente.

---

## Configuracao Necessaria

Para a integracao funcionar, o usuario precisara:

1. **Definir a URL da API** - Criar arquivo `.env` ou configurar variavel:
   ```
   VITE_API_URL=https://sua-api-url.vercel.app
   ```

2. **API funcionando** - O deploy da API precisa estar ativo (atualmente mostra 404)

3. **CORS configurado** - A API precisa aceitar requisicoes do frontend

---

## Ordem de Implementacao Recomendada

1. Criar cliente HTTP e servicos base
2. Integrar autenticacao (login/logout)
3. Conectar empresas no sidebar
4. Conectar pontes na aba Pontes
5. Conectar usuarios na aba Usuarios
6. Conectar dispositivos na aba Dispositivos
7. Integrar telemetria no dashboard

Cada fase pode ser testada independentemente antes de avancar.

---

## Observacoes Importantes

- O deploy atual da API (`d2win-api.vercel.app`) esta retornando 404
- A integracao requer que a API esteja funcionando e acessivel
- O frontend atualmente usa dados mock que serao substituidos gradualmente
- A API usa MongoDB com ObjectIds, o frontend precisara adaptar os IDs
