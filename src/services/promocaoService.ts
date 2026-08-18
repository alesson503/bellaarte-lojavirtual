import { API_URL } from '../config';
import { authHeader } from '../auth/authService';

export interface Promocao {
  id: number;
  nome: string;
  percentual: number;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_em: string;
}

export async function getPromocaoAtiva(): Promise<Promocao | null> {
  const res = await fetch(`${API_URL}/api/promocoes/ativa`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar promoção.');
  return data.promocao;
}

export async function listPromocoes(): Promise<Promocao[]> {
  const res = await fetch(`${API_URL}/api/promocoes`, { headers: authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar promoções.');
  return data.promocoes;
}

export async function criarPromocao(input: { nome: string; percentual: number; data_inicio: string; data_fim: string }): Promise<Promocao> {
  const res = await fetch(`${API_URL}/api/promocoes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao criar promoção.');
  return data.promocao;
}

export async function atualizarPromocao(id: number, input: Partial<{ nome: string; percentual: number; data_inicio: string; data_fim: string; ativo: boolean }>): Promise<Promocao> {
  const res = await fetch(`${API_URL}/api/promocoes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar promoção.');
  return data.promocao;
}

export async function apagarPromocao(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/api/promocoes/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao apagar promoção.');
  }
}
