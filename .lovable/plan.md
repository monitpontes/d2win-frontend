

# Plano: Corrigir Loop de Redirecionamento e Problemas de Login

## Problemas Identificados

### 1. AuthProvider Duplicado
O `AuthProvider` está sendo renderizado **duas vezes**:
- Uma vez em `src/main.tsx` (linha 7-9)
- Outra vez em `src/App.tsx` (linha 19)

Isso causa conflitos de contexto e erros intermitentes.

### 2. Loop de Redirecionamento por Erro 401
Quando um usuário tenta fazer login e a API retorna um erro 401 (token inválido ou expirado), o interceptor do axios:
1. Limpa todos os tokens
2. Redireciona para `/login` via `window.location.href`

Mas este comportamento está acontecendo **também durante o processo de login**, causando loop infinito.

### 3. Verificação de API Configurada
A função `isApiConfigured()` verifica apenas `VITE_API_URL`, mas como agora temos um fallback hardcoded, ela sempre retorna `false` quando a variável de ambiente não está definida - mesmo com o fallback funcionando.

---

## Solução

### Fase 1: Remover AuthProvider Duplicado

Manter apenas UM `AuthProvider` - no `App.tsx` (que é o padrão correto).

**Arquivo:** `src/main.tsx`
```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### Fase 2: Corrigir Verificação de API Configurada

Atualizar a função para também considerar o fallback.

**Arquivo:** `src/contexts/AuthContext.tsx`
```typescript
// Verifica se a API está disponível (sempre true agora com fallback)
const isApiConfigured = (): boolean => {
  // Com fallback hardcoded, API está sempre configurada
  return true;
};
```

### Fase 3: Evitar Loop de Redirecionamento no 401

Modificar o interceptor para **não redirecionar durante o login**.

**Arquivo:** `src/lib/api/client.ts`
```typescript
api.interceptors.response.use(
  (response) => {
    // ... código existente
  },
  (error) => {
    console.error(`[API Error]...`, { ... });
    
    // Evitar loop: não redirecionar se já está na página de login
    // ou se é uma requisição de login/auth
    const isAuthRequest = error.config?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname === '/login';
    
    if (error.response?.status === 401 && !isAuthRequest && !isLoginPage) {
      localStorage.removeItem('d2win_token');
      sessionStorage.removeItem('d2win_token');
      localStorage.removeItem('d2win_user');
      sessionStorage.removeItem('d2win_session');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/main.tsx` | Remover AuthProvider duplicado |
| `src/contexts/AuthContext.tsx` | Atualizar `isApiConfigured()` para retornar `true` |
| `src/lib/api/client.ts` | Evitar loop de 401 durante autenticação |

---

## Seção Técnica Detalhada

### Por que os logins do banco não estão funcionando?

Olhando a imagem que você enviou, os usuários no MongoDB são:
- `admin@d2win.com` (company_id: null)
- `jmeneses682@gmail.com`
- `testeuser@viewer.com`
- `viewermotiva@d2win.com`

O problema é que:
1. O login provavelmente está funcionando na API
2. Mas o interceptor de 401 está limpando a sessão imediatamente após

### Fluxo atual (com bug):
```
1. Usuário faz login
2. API retorna token + user
3. Token é salvo no storage
4. Navigate para /dashboard
5. initAuth() é chamado
6. /auth/me é chamado
7. Se houver qualquer erro -> limpa storage e redireciona para /login
8. Loop infinito
```

### Fluxo corrigido:
```
1. Usuário faz login
2. API retorna token + user
3. Token é salvo no storage
4. Navigate para /dashboard
5. initAuth() é chamado
6. /auth/me é chamado (com token válido)
7. Se sucesso -> mantém sessão
8. Se erro 401 (e não é request de auth) -> redireciona
```

---

## Resultado Esperado

Após implementação:
1. Login com usuários do banco (`admin@d2win.com`, etc.) funcionará
2. Não haverá mais loop de redirecionamento
3. Dashboard carregará normalmente após login bem-sucedido

---

## Estimativa

- **Tempo:** ~10 minutos
- **Arquivos:** 3

