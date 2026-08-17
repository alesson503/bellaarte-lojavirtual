// Pedidos de verdade — fala com a API da loja (Postgres no Railway).
import { API_URL } from '../config';
import { authHeader } from '../auth/authService';
import type { CartItem } from '../types';

export interface Order {
  id: string;
  cliente_id: string | null;
  nome: string;
  telefone: string;
  entrega: string;
  itens: CartItem[];
  total: number;
  status: string;
  criado_em: string;
}

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Algo deu errado. Tente de novo.');
  return data;
}

export async function createOrder(data: {
  clienteId: string | null;
  nome: string;
  telefone: string;
  entrega: string;
  itens: CartItem[];
  total: number;
}): Promise<Order> {
  const res = await fetch(`${API_URL}/api/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await parseOrThrow(res);
  return json.pedido;
}

export async function listOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/pedidos`, { headers: authHeader() });
  const json = await parseOrThrow(res);
  return json.pedidos;
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/pedidos/${id}`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Não foi possível apagar o pedido.');
  }
}
