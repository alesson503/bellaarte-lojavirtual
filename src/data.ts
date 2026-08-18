// Catálogo real da Bella Arte, extraído da tela de Produtos do sistema em
// 2026-08-16 (sem acesso ao banco — puxado de prints que o dono mandou).
// Produtos com várias variações viram um "grupo" (MULTI) ou um "link" pra um
// configurador dedicado, em vez de uma lista enorme de cards repetidos.

export type Categoria = 'Adesivo' | 'Banner' | 'Caneca' | 'Cartão de Visita' | 'Outros';

export interface LinkProduct {
  tipo: 'link';
  id: string;
  nome: string;
  categoria: Categoria;
  desde: number;
  unidade?: string;
  target: 'adesivos' | 'cartoes';
}

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
  preco: (v: Record<string, string>) => number | null;
}

export interface MedidaProduct {
  tipo: 'medida';
  id: string;
  nome: string;
  categoria: Categoria;
  precoM2: number;
}

export interface SimpleProduct {
  tipo: 'simples';
  nome: string;
  categoria: Categoria;
  preco: number;
  unidade?: string;
  imagem?: string;
  precoOriginal?: number;
  descontoPercentual?: number;
  descricao?: string;
  cores?: string[];
}

export type Produto = LinkProduct | MultiProduct | MedidaProduct | SimpleProduct;

// Produtos que já têm um configurador dedicado (seção "Monte o seu") — no
// catálogo viram um card simples com "a partir de" + botão que leva até o
// configurador, em vez de duplicar a lógica de preço em outro lugar.
export const LINKS: LinkProduct[] = [
  { tipo: 'link', id: 'cartao', nome: 'Cartão de Visita', categoria: 'Cartão de Visita', desde: 80, target: 'cartoes' },
  { tipo: 'link', id: 'adesivo-uv', nome: 'Adesivo UV', categoria: 'Adesivo', unidade: 'm²', desde: 200, target: 'adesivos' },
  { tipo: 'link', id: 'adesivo-vinil', nome: 'Adesivo Vinil', categoria: 'Adesivo', unidade: 'm²', desde: 180, target: 'adesivos' },
];

// Produtos com 2 campos separados (ex: Tamanho + Blackout) — cada campo é um
// seletor próprio em vez de um dropdown combinando tudo. Preço vem de uma
// tabela real do sistema, não de uma fórmula inventada.
export const MULTI: MultiProduct[] = [
  {
    tipo: 'multi', id: 'windbanner', nome: 'Wind Banner', categoria: 'Banner',
    dims: [
      { key: 'tam', label: 'Tamanho', options: ['P', 'G', 'GG'] },
      { key: 'bk', label: 'Blackout', options: ['Sem', 'Com'] },
    ],
    preco(v) {
      const t: Record<string, Record<string, number>> = {
        P: { Sem: 260, Com: 290 }, G: { Sem: 294, Com: 324 }, GG: { Sem: 334, Com: 364 },
      };
      return t[v.tam][v.bk];
    },
  },
  {
    tipo: 'multi', id: 'placaps', nome: 'Placa PS', categoria: 'Outros', unidade: 'm²',
    dims: [
      { key: 'esp', label: 'Espessura', options: ['1mm', '2mm', '3mm'] },
      { key: 'imp', label: 'Impressão', options: ['Solvente', 'UV'] },
    ],
    preco(v) {
      const t: Record<string, Record<string, number>> = {
        '1mm': { Solvente: 280, UV: 300 }, '2mm': { Solvente: 380, UV: 400 }, '3mm': { Solvente: 480, UV: 500 },
      };
      return t[v.esp][v.imp];
    },
  },
  {
    tipo: 'multi', id: 'panfletos', nome: 'Panfletos (10×14cm)', categoria: 'Outros',
    dims: [
      { key: 'qtd', label: 'Quantidade', options: ['100', '250', '500', '1.000', '2.500', '5.000'] },
      { key: 'cor', label: 'Cor', options: ['4×0 (1 cor)', '4×4 (colorido)'] },
    ],
    // 5.000un só existe colorido no sistema real — sem 4×0 pra essa quantidade.
    preco(v) {
      const t: Record<string, Record<string, number>> = {
        '100': { '4×0 (1 cor)': 112, '4×4 (colorido)': 132 },
        '250': { '4×0 (1 cor)': 140, '4×4 (colorido)': 160 },
        '500': { '4×0 (1 cor)': 160, '4×4 (colorido)': 194 },
        '1.000': { '4×0 (1 cor)': 180, '4×4 (colorido)': 180 },
        '2.500': { '4×0 (1 cor)': 230, '4×4 (colorido)': 270 },
        '5.000': { '4×4 (colorido)': 380 },
      };
      return t[v.qtd]?.[v.cor] ?? null;
    },
  },
];

// Produtos cobrados por m², onde o cliente digita a metragem que quer
// (Largura × Altura) em vez de escolher entre tamanhos fixos.
export const MEDIDA: MedidaProduct[] = [
  { tipo: 'medida', id: 'banner-lona', nome: 'Banner / Lona', categoria: 'Banner', precoM2: 100 },
];

export const SIMPLES: SimpleProduct[] = [
  { tipo: 'simples', nome: 'Caneca Branca', categoria: 'Caneca', preco: 40 },
  { tipo: 'simples', nome: 'Caneca 180ml', categoria: 'Caneca', preco: 45 },
  { tipo: 'simples', nome: 'Caneca com alça colorida / colher', categoria: 'Caneca', preco: 60 },
  { tipo: 'simples', nome: 'Pires', categoria: 'Caneca', preco: 15 },
  { tipo: 'simples', nome: 'Cavalete', categoria: 'Outros', preco: 280 },
  { tipo: 'simples', nome: 'Crachá', categoria: 'Outros', preco: 30 },
  { tipo: 'simples', nome: 'Fotoíma', categoria: 'Outros', preco: 20 },
  { tipo: 'simples', nome: 'Papel Adesivo 215g', categoria: 'Adesivo', preco: 20 },
  { tipo: 'simples', nome: 'Papel Fotográfico', categoria: 'Outros', preco: 15 },
  { tipo: 'simples', nome: 'Papel Opaline 180g', categoria: 'Outros', preco: 12 },
  { tipo: 'simples', nome: 'Papel Vergê 180g', categoria: 'Outros', preco: 12 },
  { tipo: 'simples', nome: 'Plastificação A4', categoria: 'Outros', preco: 10 },
  { tipo: 'simples', nome: 'Polaroid', categoria: 'Outros', preco: 15 },
  { tipo: 'simples', nome: 'Polaroid com Frase', categoria: 'Outros', preco: 25 },
  { tipo: 'simples', nome: 'Sulfite — Impressão Colorida', categoria: 'Outros', preco: 3 },
  { tipo: 'simples', nome: 'Sulfite — Impressão P&B', categoria: 'Outros', preco: 1 },
];

export const CATALOGO: Produto[] = [...LINKS, ...MULTI, ...MEDIDA, ...SIMPLES];

export const CATEGORIAS: string[] = [
  'Todos',
  ...Array.from(new Set(CATALOGO.map(p => p.categoria))).sort(),
];

// ── configurador "Monte seu Adesivo" ──
export const ADESIVO_PRECOS: Record<string, Record<string, number>> = {
  UV: { Recortado: 200, Refilado: 200, Laminado: 230 },
  Vinil: { Recortado: 180, Refilado: 180, Laminado: 200 },
};

// ── configurador "Monte seu Cartão de Visita" ──
export const CARTAO_PRECOS: Record<number, { semVerniz: Record<string, number>; comVerniz?: Record<string, number> }> = {
  100: { semVerniz: { '4x0': 80, '4x1': 80, '4x4': 80 } },
  250: { semVerniz: { '4x0': 90, '4x1': 90, '4x4': 90 } },
  500: { semVerniz: { '4x0': 100, '4x1': 100, '4x4': 100 } },
  1000: {
    semVerniz: { '4x0': 120, '4x1': 120, '4x4': 120 },
    comVerniz: { '4x0': 200, '4x4': 200 }, // não existe 4×1 com verniz no sistema real
  },
};

export const IMP_LABEL: Record<string, string> = {
  '4x0': 'Só frente (4×0)',
  '4x1': 'Frente + verso P&B (4×1)',
  '4x4': 'Frente e verso coloridos (4×4)',
};

export const fmt = (n: number) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
