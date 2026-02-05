
# Plano: Implementar RBAC com Admin Global, Admin Empresa e Viewer

## Arquitetura de Roles

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN GLOBAL                                        │
│ • Acesso total ao sistema                                                    │
│ • Pode criar outros Admin Global                                              │
│ • Vê sidebar com TODAS as empresas                                            │
│ • Acessa /admin com todas abas                                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ADMIN DA EMPRESA (gestor)                             │
│ • Acesso apenas à SUA empresa                                                 │
│ • Pode editar informações da empresa                                          │
│ • Acessa /admin (só da sua empresa)                                           │
│ • NÃO vê sidebar de empresas (só a própria)                                   │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         VIEWER DA EMPRESA                                     │
│ • Apenas visualização da SUA empresa                                          │
│ • NÃO acessa /admin                                                           │
│ • Só vê dashboard da própria empresa                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mudanças por Arquivo

### 1. `src/types/index.ts`

Atualizar o tipo UserRole para refletir a nova hierarquia:

```typescript
// Manter as mesmas roles, mas documentar o significado
export type UserRole = 'viewer' | 'gestor' | 'admin';
// viewer = Viewer da empresa (só visualiza)
// gestor = Admin da empresa (gerencia sua empresa)
// admin = Admin Global (acesso total)
```

### 2. `src/contexts/AuthContext.tsx`

Adicionar helpers para verificar roles específicas:

```typescript
interface AuthContextType {
  // ... existentes
  isGlobalAdmin: () => boolean;    // Novo
  isCompanyAdmin: () => boolean;   // Novo
  isViewer: () => boolean;         // Novo
}

// Na implementação:
const isGlobalAdmin = useCallback(() => hasRole('admin'), [hasRole]);
const isCompanyAdmin = useCallback(() => hasRole('gestor'), [hasRole]);
const isViewer = useCallback(() => hasRole('viewer'), [hasRole]);

// Atualizar canAccessAdmin
const canAccessAdmin = useCallback((): boolean => {
  return hasRole(['admin', 'gestor']); // Admin Global e Admin Empresa
}, [hasRole]);
```

### 3. `src/hooks/useCompanies.ts`

Filtrar empresas baseado na role:

```typescript
import { useAuth } from '@/contexts/AuthContext';

export function useCompanies() {
  const { user, hasRole } = useAuth();
  
  // ... query existente com rawCompanies

  // Filtrar: só Admin Global vê todas
  const companies = useMemo(() => {
    if (!user) return [];
    if (hasRole('admin')) return rawCompanies; // Admin Global
    // Gestor e Viewer só veem sua empresa
    return rawCompanies.filter(c => c.id === user.companyId);
  }, [rawCompanies, user, hasRole]);

  return {
    companies,          // Filtrado por role
    allCompanies: rawCompanies, // Todas (só usar onde necessário)
    // ... resto
  };
}
```

### 4. `src/pages/Dashboard.tsx`

Restringir visualização por empresa:

```typescript
export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const isGlobalAdmin = hasRole('admin');

  // Se não for Admin Global, força a empresa do usuário
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isGlobalAdmin ? 'all' : (user?.companyId || 'all')
  );

  // Bloquear mudança de empresa para não-admin
  const handleSelectCompany = (companyId: string) => {
    if (!isGlobalAdmin) return; // Não permite mudar
    setSelectedCompanyId(companyId);
  };

  return (
    <div className="flex flex-1">
      {/* Sidebar só aparece para Admin Global */}
      {isGlobalAdmin && (
        <CompanySidebar 
          selectedCompanyId={selectedCompanyId} 
          onSelectCompany={handleSelectCompany} 
        />
      )}
      
      <main className="flex-1 ...">
        {/* ... conteúdo */}
      </main>
    </div>
  );
}
```

### 5. `src/components/layout/CompanySidebar.tsx`

Restringir ações:

```typescript
export function CompanySidebar({ ... }) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin'); // Só Admin Global

  // Só Admin Global vê "Todas as Empresas"
  // Só Admin Global pode adicionar empresa
  
  return (
    <aside ...>
      {/* Opção "Todas" - só Admin Global */}
      {isAdmin && (
        <button onClick={() => onSelectCompany('all')} ...>
          Todas as Empresas
        </button>
      )}
      
      {/* Lista de empresas */}
      {/* ... */}
      
      {/* Botão Nova Empresa - só Admin Global */}
      {isAdmin && (
        <Dialog ...>
          <Button>Nova Empresa</Button>
        </Dialog>
      )}
    </aside>
  );
}
```

### 6. `src/pages/Admin.tsx`

Aplicar RBAC completo:

```typescript
export default function Admin() {
  const { user, hasRole } = useAuth();
  const isGlobalAdmin = hasRole('admin');
  const isCompanyAdmin = hasRole('gestor');

  // Se for Admin Empresa, força a empresa dele
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isGlobalAdmin ? '' : (user?.companyId || '')
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar de empresas só para Admin Global */}
      {isGlobalAdmin && (
        <AdminSidebar 
          selectedCompanyId={selectedCompanyId} 
          onSelectCompany={setSelectedCompanyId} 
        />
      )}

      <div className="flex-1 ...">
        {/* Título mostra empresa fixa para Admin Empresa */}
        <p className="text-muted-foreground">
          Gerenciando: <span className="text-primary font-medium">
            {isGlobalAdmin 
              ? (selectedCompany?.name || 'Selecione uma empresa')
              : user?.companyId ? 'Sua Empresa' : 'N/A'
            }
          </span>
        </p>
        
        {/* ... tabs e conteúdo */}
      </div>
    </div>
  );
}
```

### 7. `src/components/admin/AdminSidebar.tsx`

Restringir CRUD:

```typescript
export function AdminSidebar({ ... }) {
  const { hasRole } = useAuth();
  const isGlobalAdmin = hasRole('admin');

  // Só Admin Global pode adicionar/editar/excluir empresas
  return (
    <div ...>
      <div className="flex items-center justify-between">
        <span>Empresas</span>
        {isGlobalAdmin && (
          <Button onClick={() => setIsAddCompanyOpen(true)}>
            <Plus />
          </Button>
        )}
      </div>

      {companies.map(company => (
        <div key={company.id} ...>
          <span>{company.name}</span>
          
          {/* Dropdown só para Admin Global */}
          {isGlobalAdmin && (
            <DropdownMenu>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Excluir</DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}
```

### 8. `src/components/layout/Header.tsx`

Atualizar labels:

```typescript
const getRoleName = (role: string) => {
  const roles: Record<string, string> = {
    admin: 'Admin Global',
    gestor: 'Admin Empresa',
    viewer: 'Visualizador',
  };
  return roles[role] || role;
};
```

### 9. `src/hooks/useUsers.ts`

Atualizar para permitir Admin Global criar qualquer usuário:

```typescript
// O hook já está correto, mas no Admin.tsx:
// - Admin Global pode criar qualquer role (incluindo admin)
// - Admin Empresa só pode criar gestor/viewer da sua empresa
```

### 10. `src/pages/Admin.tsx` - Formulário de novo usuário

```typescript
// No select de role, mostrar opção 'admin' apenas para Admin Global
<Select value={newUserForm.role} ...>
  <SelectContent>
    {isGlobalAdmin && <SelectItem value="admin">Admin Global</SelectItem>}
    <SelectItem value="gestor">Admin Empresa</SelectItem>
    <SelectItem value="viewer">Visualizador</SelectItem>
  </SelectContent>
</Select>
```

## Matriz de Permissões Final

| Funcionalidade | Viewer | Admin Empresa | Admin Global |
|----------------|--------|---------------|--------------|
| Ver dashboard | ✅ (só sua empresa) | ✅ (só sua empresa) | ✅ (todas) |
| Sidebar empresas no Dashboard | ❌ | ❌ | ✅ |
| Acessar /admin | ❌ | ✅ (só sua empresa) | ✅ (todas) |
| Sidebar empresas no Admin | ❌ | ❌ | ✅ |
| Criar/Editar empresas | ❌ | ❌ | ✅ |
| Criar usuários | ❌ | ✅ (gestor/viewer) | ✅ (todos) |
| Criar Admin Global | ❌ | ❌ | ✅ |
| Editar pontes | ❌ | ✅ | ✅ |
| Editar dispositivos | ❌ | ✅ | ✅ |

## Arquivos a Modificar

1. `src/contexts/AuthContext.tsx` - Adicionar helpers isGlobalAdmin, isCompanyAdmin
2. `src/hooks/useCompanies.ts` - Filtrar empresas por role
3. `src/pages/Dashboard.tsx` - Esconder sidebar para não-admin, forçar empresa
4. `src/pages/Admin.tsx` - Esconder sidebar para Admin Empresa, restringir roles no form
5. `src/components/layout/CompanySidebar.tsx` - Esconder "Todas" e "Nova Empresa"
6. `src/components/admin/AdminSidebar.tsx` - Esconder CRUD para não-admin
7. `src/components/layout/Header.tsx` - Atualizar labels de roles

## Seção Técnica

A validação de roles é feita no frontend baseada no campo `role` retornado pela API `/auth/me`. O backend deve garantir que:

1. O campo `role` é retornado corretamente no login e `/auth/me`
2. Endpoints de CRUD verificam a role do usuário no servidor
3. Endpoints de listagem filtram por `company_id` quando apropriado

Os roles são:
- `admin` = Admin Global
- `gestor` = Admin da Empresa  
- `viewer` = Viewer da Empresa

O `companyId` do usuário determina a qual empresa ele pertence (para gestor e viewer).
