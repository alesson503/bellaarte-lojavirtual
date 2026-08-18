import { API_URL } from '../config';
import { authHeader } from '../auth/authService';

export interface ErpProduto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  unidade_venda: 'un' | 'm2';
  foto_url?: string | null;
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
  preco_original: number;
  desconto_percentual: number;
  unidade: string | null;
  ativo: boolean;
  imagem_url: string | null;
  descricao: string | null;
  cores: string[];
  especificacoes: { chave: string; valor: string }[];
}

export async function listLojaProducts(): Promise<LojaProduto[]> {
  const res = await fetch(`${API_URL}/api/produtos`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar produtos.');
  return data.produtos;
}

export async function atualizarDescontoProduto(id: string, desconto: number | null): Promise<void> {
  const res = await fetch(`${API_URL}/api/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ desconto_percentual: desconto ?? '' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar desconto.');
}

export async function atualizarDetalhesProduto(
  id: string, descricao: string, cores: string[], especificacoes: { chave: string; valor: string }[],
): Promise<void> {
  const res = await fetch(`${API_URL}/api/produtos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ descricao, cores, especificacoes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar os detalhes.');
}

export async function uploadImagemProduto(id: string, imagemDataUrl: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/produtos/${id}/imagem`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ imagem: imagemDataUrl }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao enviar imagem.');
}

export async function removerImagemProduto(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/produtos/${id}/imagem`, { method: 'DELETE', headers: authHeader() });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao remover imagem.');
  }
}

// Preço do configurador de Adesivo — vem do banco (sincronizado do ERP por
// nome), mesmo formato que a tabela fixa antiga em data.ts.
export type AdesivoPrecos = Record<'UV' | 'Vinil', Record<'Recortado' | 'Refilado' | 'Laminado', number>>;

export async function getAdesivoPrecos(): Promise<AdesivoPrecos> {
  const res = await fetch(`${API_URL}/api/produtos/adesivo-precos`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar preços do Adesivo.');
  return data.precos;
}

export interface AdesivoCombo {
  material: string;
  acabamento: string;
  preco: number | null;
  erp_nome_esperado: string;
  sincronizado: boolean;
  atualizado_em: string;
}

export async function getAdesivoStatus(): Promise<{ combos: AdesivoCombo[]; sugestoes: string[] }> {
  const res = await fetch(`${API_URL}/api/produtos/adesivo-status`, { headers: authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar status do Adesivo.');
  return data;
}

export async function corrigirNomeAdesivo(material: string, acabamento: string, novoNome: string): Promise<AdesivoCombo> {
  const res = await fetch(`${API_URL}/api/produtos/adesivo-precos/${encodeURIComponent(material)}/${encodeURIComponent(acabamento)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ erp_nome_esperado: novoNome }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao corrigir nome.');
  return data.combo;
}
