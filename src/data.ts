// Tipos do catálogo. Os produtos em si (nomes, preços) vêm todos do ERP.

// Categoria vem do cadastro do ERP, do jeito que estiver escrita lá.
export type Categoria = string;

export interface MultiDim {
  key: string;
  label: string;
  options: string[];
}

export interface MultiProduct {
  tipo: 'multi';
  id: string;
  nome: string;
  categoria: Categoria;
  unidade?: string;
  dims: MultiDim[];
  // Quando true, `preco()` devolve o valor por m² (não o preço final) — a
  // ficha do produto mostra largura×altura e multiplica pela área, igual o
  // Adesivo já fazia no configurador antigo.
  porM2?: boolean;
  preco: (v: Record<string, string>) => number | null;
  imagem?: string;
  // Quando existe, a foto muda conforme a combinação escolhida (ex.: uma
  // foto pro Wind Banner tamanho P, outra pro M) — cada foto vem do próprio
  // produto individual cadastrado no admin. Sem isso, usa `imagem` fixo.
  fotoPorCombo?: (v: Record<string, string>) => string | undefined;
  // Id do produto no ERP de cada combinação (só nos grupos montados a
  // partir de produtos do ERP) — o ERP usa pra achar o custo.
  erpIdPorCombo?: (v: Record<string, string>) => string | undefined;
  // Ficha do produto (material, cores, tamanho…) — hoje só nos grupos de
  // produtos importados do fornecedor.
  especificacoes?: { chave: string; valor: string }[];
  descricao?: string;
}

export interface MedidaProduct {
  tipo: 'medida';
  id: string;
  nome: string;
  categoria: Categoria;
  // Preço por m² (ou por metro, quando `linear`).
  precoM2: number;
  // Metro linear (ex.: DTF Têxtil): o cliente só informa o comprimento.
  linear?: boolean;
  erpId?: string;
  imagem?: string;
}

export interface SimpleProduct {
  tipo: 'simples';
  nome: string;
  erpId?: string;
  categoria: Categoria;
  preco: number;
  unidade?: string;
  imagem?: string;
  precoOriginal?: number;
  descontoPercentual?: number;
  descricao?: string;
  cores?: { nome: string; foto: string | null }[];
  especificacoes?: { chave: string; valor: string }[];
  // Importado do fornecedor: nome do grupo e a opção ("50 un") desse item.
  grupo?: string;
  opcao?: string;
}

export type Produto = MultiProduct | MedidaProduct | SimpleProduct;

// Todo produto (e todo preço) vem do ERP — ver hooks/useProdutos.ts, que
// junta as variações soltas do ERP (ex.: 11 itens de Panfletos) num produto
// só com seletores. Essa lista só dá nome/id estável pra cada grupo, usado
// pelo painel admin pra foto de capa do grupo.
export const GRUPOS_CATALOGO: { id: string; nome: string; categoria: string }[] = [
  { id: 'panfletos', nome: 'Panfletos (10×14cm)', categoria: 'Panfletos' },
  { id: 'cartao-visita', nome: 'Cartão de Visita', categoria: 'Cartão de Visita' },
  { id: 'cartao-duplo', nome: 'Cartão Duplo', categoria: 'Cartões Duplo' },
  { id: 'windbanner', nome: 'Wind Banner', categoria: 'Wind Banner' },
  { id: 'placaps', nome: 'Placa PS', categoria: 'Placa PS' },
  { id: 'adesivo-uv', nome: 'Adesivo UV', categoria: 'Adesivo' },
  { id: 'adesivo-vinil', nome: 'Adesivo Vinil', categoria: 'Adesivo' },
  { id: 'banner-lona', nome: 'Banner / Lona', categoria: 'Banner' },
];

export const IMP_LABEL: Record<string, string> = {
  '4x0': 'Só frente (4×0)',
  '4x1': 'Frente + verso P&B (4×1)',
  '4x4': 'Frente e verso coloridos (4×4)',
};

export const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
