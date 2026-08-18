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
