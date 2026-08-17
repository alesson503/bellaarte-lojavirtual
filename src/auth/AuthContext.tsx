import { createContext, useContext, useState, type ReactNode } from 'react';
import * as authService from './authService';
import type { User } from './authService';

interface AuthContextValue {
  user: User | null;
  login: (email: string, senha: string) => User;
  register: (nome: string, email: string, senha: string) => User;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authService.getSession());

  function login(email: string, senha: string) {
    const u = authService.login(email, senha);
    setUser(u);
    return u;
  }

  function register(nome: string, email: string, senha: string) {
    const u = authService.register(nome, email, senha);
    setUser(u);
    return u;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
