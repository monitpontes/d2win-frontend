

# Plano: Corrigir Carregamento da URL da API

## Problema Identificado

A variável de ambiente `VITE_API_URL` existe nos secrets do projeto, mas **não está chegando ao código**. Nos logs do console vemos:

- `[API Request] GET /companies` - Note que não há baseURL antes do `/companies`
- A resposta é HTML (a página do Lovable) em vez de JSON da API
- O "Count: 1371" é o tamanho do HTML em caracteres, não quantidade de registros

Isso acontece porque variáveis `VITE_*` são injetadas **no momento do build**, e o código atual pode estar usando um cache antigo.

---

## Solução

### Fase 1: Forçar Rebuild com Variável de Ambiente

Adicionar um log no cliente API para mostrar a URL configurada, permitindo diagnosticar se a variável está sendo carregada:

```typescript
// src/lib/api/client.ts
const API_URL = import.meta.env.VITE_API_URL || '';

console.log('[API] Configured baseURL:', API_URL || '(empty - using relative URLs)');
```

### Fase 2: Adicionar Fallback para URL Hardcoded (Temporário)

Como medida de segurança, adicionar a URL da API como fallback caso a variável de ambiente falhe:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://d2win-api.onrender.com';
```

### Fase 3: Validar Tipo de Resposta

Adicionar validação no interceptor para detectar respostas HTML inesperadas:

```typescript
api.interceptors.response.use(
  (response) => {
    // Detectar se recebeu HTML em vez de JSON
    if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
      console.error('[API] Received HTML instead of JSON - check API_URL configuration');
      throw new Error('API returned HTML instead of JSON. Check VITE_API_URL configuration.');
    }
    return response;
  },
  // ...
);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/api/client.ts` | Adicionar fallback para URL da API e validação de resposta HTML |

---

## Seção Técnica

### Código Completo do client.ts

```typescript
import axios from 'axios';

// Fallback para URL da API caso variável de ambiente não carregue
const API_URL = import.meta.env.VITE_API_URL || 'https://d2win-api.onrender.com';

console.log('[API] Configured baseURL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('d2win_token') || sessionStorage.getItem('d2win_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Detectar resposta HTML inesperada
    if (typeof response.data === 'string' && response.data.includes('<!doctype')) {
      console.error('[API] Received HTML instead of JSON - check API_URL configuration');
      throw new Error('API returned HTML instead of JSON');
    }
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('d2win_token');
      sessionStorage.removeItem('d2win_token');
      localStorage.removeItem('d2win_user');
      sessionStorage.removeItem('d2win_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Resultado Esperado

Após a implementação:
1. O log mostrará `[API] Configured baseURL: https://d2win-api.onrender.com`
2. As requisições irão para a API correta
3. Os dados de empresas e pontes serão carregados
4. O dashboard mostrará os KPIs reais

---

## Estimativa

- **Tempo**: ~5 minutos
- **Arquivos**: 1

