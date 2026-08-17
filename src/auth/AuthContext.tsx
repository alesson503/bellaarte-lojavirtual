import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authService from './authService';
import type { User } from './authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  register: (nome: string, email: string, senha: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.fetchSession().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  async function login(email: string, senha: string) {
    const u = await authService.login(email, senha);
    setUser(u);
    return u;
  }

  async function register(nome: string, email: string, senha: string) {
    const u = await authService.register(nome, email, senha);
    setUser(u);
    return u;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
