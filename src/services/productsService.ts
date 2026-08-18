import { API_URL } from '../config';
import { authHeader } from '../auth/authService';

export interface ErpProduto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade_venda: 'un' | 'm2';
}

export async function listErpProducts(): Promise<ErpProduto[]> {
  const res = await fetch(`${API_URL}/api/produtos/erp`, { headers: authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar produtos do ERP.');
  return data.produtos;
}

export async function sincronizarProdutosErp(): Promise<{ total: number }> {
  const res = await fetch(`${API_URL}/api/produtos/sincronizar`, { method: 'POST', headers: authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao sincronizar.');
  return data;
}

// Produtos "simples" (preço fixo, sem calculadora) — vêm do banco da loja,
// que é sincronizado automaticamente do ERP. Público, qualquer visitante
// da loja pode buscar (é o catálogo mostrado na vitrine).
export interface LojaProduto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade: string | null;
  ativo: boolean;
}

export async function listLojaProducts(): Promise<LojaProduto[]> {
  const res = await fetch(`${API_URL}/api/produtos`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar produtos.');
  return data.produtos;
}
