import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { authService } from '@/lib/api';
import { getUserByEmail } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'd2win_user';
const SESSION_KEY = 'd2win_session';
const TOKEN_KEY = 'd2win_token';

// Verifica se a API está configurada
const isApiConfigured = (): boolean => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return !!apiUrl && apiUrl.length > 0;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);
      
      // Se temos token e API configurada, valida com /auth/me
      if (token && isApiConfigured()) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // Atualiza o usuário armazenado
          const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
          const key = localStorage.getItem(TOKEN_KEY) ? STORAGE_KEY : SESSION_KEY;
          storage.setItem(key, JSON.stringify(currentUser));
        } catch (error) {
          // Token inválido, limpa storage
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
        }
      } else if (storedUser) {
        // Fallback para dados locais (modo mock)
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch {
          localStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean = false): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Se API está configurada, usa autenticação real
    if (isApiConfigured()) {
      try {
        const { token, user: loggedUser } = await authService.login(email, password);
        
        // Armazena token e usuário
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(remember ? STORAGE_KEY : SESSION_KEY, JSON.stringify(loggedUser));
        
        setUser(loggedUser);
        setIsLoading(false);
        return { success: true };
      } catch (error: any) {
        setIsLoading(false);
        const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao fazer login';
        return { success: false, error: message };
      }
    }
    
    // Fallback: Mock authentication (quando API não está configurada)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (password !== '0000') {
      setIsLoading(false);
      return { success: false, error: 'Credenciais inválidas. Use a senha: 0000' };
    }
    
    const foundUser = getUserByEmail(email);
    if (!foundUser) {
      setIsLoading(false);
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    if (foundUser.status !== 'active') {
      setIsLoading(false);
      return { success: false, error: 'Usuário inativo. Contate o administrador.' };
    }
    
    const storage = remember ? localStorage : sessionStorage;
    const key = remember ? STORAGE_KEY : SESSION_KEY;
    storage.setItem(key, JSON.stringify(foundUser));
    
    setUser(foundUser);
    setIsLoading(false);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  const canAccessAdmin = useCallback((): boolean => {
    return hasRole(['admin', 'gestor']);
  }, [hasRole]);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canAccessAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
