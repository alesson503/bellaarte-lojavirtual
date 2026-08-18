// Autenticação de verdade — fala com a API da loja (Postgres no Railway,
// separado do ERP). O token JWT fica salvo no navegador; os dados do
// cliente/pedido ficam no banco, então valem pra qualquer aparelho.

import { API_URL } from '../config';

export type Role = 'cliente' | 'admin';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

const TOKEN_KEY = 'bellaarte_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Algo deu errado. Tente de novo.');
  return data;
}

export async function register(nome: string, email: string, senha: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha }),
  });
  const data = await parseOrThrow(res);
  setToken(data.token);
  return data.user;
}

export async function login(email: string, senha: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
  const data = await parseOrThrow(res);
  setToken(data.token);
  return data.user;
}

// Confere se o token salvo ainda é válido e traz o usuário atual — usado
// só na inicialização do app. Nunca lança erro: se der problema, considera
// como "deslogado".
export async function fetchSession(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeader() });
    if (!res.ok) { logout(); return null; }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function listCustomers(): Promise<{ id: string; nome: string; email: string; criado_em: string }[]> {
  const res = await fetch(`${API_URL}/api/auth/clientes`, { headers: authHeader() });
  const data = await parseOrThrow(res);
  return data.clientes;
}

export async function trocarSenha(senhaAtual: string, senhaNova: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/senha`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ senhaAtual, senhaNova }),
  });
  await parseOrThrow(res);
}
