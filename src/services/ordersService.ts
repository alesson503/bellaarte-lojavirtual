// Pedidos locais (mock) — mesma ideia do authService: guarda no localStorage
// pra você testar o painel admin agora. Quando integrar com o sistema real,
// troque o corpo destas funções por chamadas à API.

import type { CartItem } from '../types';

export interface Order {
  id: string;
  clienteId: string | null;
  nome: string;
  telefone: string;
  entrega: string;
  itens: CartItem[];
  total: number;
  criadoEm: string;
}

const ORDERS_KEY = 'bellaarte_orders';

function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) as Order[] : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function createOrder(data: Omit<Order, 'id' | 'criadoEm'>): Order {
  const order: Order = { ...data, id: crypto.randomUUID(), criadoEm: new Date().toISOString() };
  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);
  return order;
}

export function listOrders(): Order[] {
  return readOrders();
}
