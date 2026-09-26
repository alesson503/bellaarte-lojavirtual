// Catálogo real da Bella Arte, extraído da tela de Produtos do sistema em
// 2026-08-16 (sem acesso ao banco — puxado de prints que o dono mandou).
// Produtos com várias variações viram um "grupo" (MULTI) — mesma ficha de
// produto pra tudo (foto + botões de opção), sem tela especial nenhuma.

export type Categoria = 'Adesivo' | 'Banner' | 'Wind Banner' | 'Caneca' | 'Cartão de Visita' | 'Cartões Duplo' | 'Outros';

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
}

export interface MedidaProduct {
  tipo: 'medida';
  id: string;
  nome: string;
  categoria: Categoria;
  precoM2: number;
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
}

export type Produto = MultiProduct | MedidaProduct | SimpleProduct;

// Produtos com 2 (ou mais) campos separados (ex: Tamanho + Blackout) — cada
// campo é um seletor próprio em vez de um dropdown combinando tudo. Preço
// vem de uma tabela real do sistema, não de uma fórmula inventada.
export const MULTI: MultiProduct[] = [
  {
    tipo: 'multi', id: 'windbanner', nome: 'Wind Banner', categoria: 'Wind Banner',
    dims: [
      { key: 'tam', label: 'Tamanho', options: ['P', 'M', 'G', 'GG'] },
      { key: 'bk', label: 'Blackout', options: ['Sem', 'Com'] },
    ],
    preco(v) {
      const t: Record<string, Record<string, number>> = {
        P: { Sem: 260, Com: 290 }, M: { Sem: 274, Com: 304 }, G: { Sem: 294, Com: 324 }, GG: { Sem: 334, Com: 364 },
      };
      return t[v.tam][v.bk];
    },
  },
  {
    // Nome e preços conferidos direto na API de produção em 2026-09-26 — o
    // sistema chama isso de "Cartão Duplo" (não "Cartão de Visita"), e não
    // tem opção de verniz (isso era um valor inventado antes). Essa entrada
    // fixa só serve de reserva pra quando o ERP estiver fora do ar — o
    // agrupamento de verdade vem de `agruparCartaoDuplo` em useProdutos.ts.
    tipo: 'multi', id: 'cartao-duplo', nome: 'Cartão Duplo', categoria: 'Cartões Duplo', unidade: 'un',
    dims: [
      { key: 'qtd', label: 'Quantidade', options: ['100', '250', '500', '1.000'] },
      { key: 'imp', label: 'Impressão', options: ['4x0', '4x1', '4x4'] },
    ],
    preco(v) {
      const t: Record<string, Record<string, number>> = {
        '100': { '4x0': 105, '4x1': 115, '4x4': 130 },
        '250': { '4x0': 120, '4x1': 135, '4x4': 150 },
        '500': { '4x0': 136, '4x1': 155, '4x4': 180 },
        '1000': { '4x0': 180, '4x1': 170, '4x4': 210 },
      };
      return t[v.qtd.replace('.', '')]?.[v.imp] ?? null;
    },
  },
  {
    tipo: 'multi', id: 'adesivo-uv', nome: 'Adesivo UV', categoria: 'Adesivo', unidade: 'm²', porM2: true,
    dims: [{ key: 'acab', label: 'Acabamento', options: ['Recortado', 'Refilado', 'Laminado'] }],
    preco: v => ADESIVO_PRECOS.UV[v.acab] ?? null,
  },
  {
    tipo: 'multi', id: 'adesivo-vinil', nome: 'Adesivo Vinil', categoria: 'Adesivo', unidade: 'm²', porM2: true,
    dims: [{ key: 'acab', label: 'Acabamento', options: ['Recortado', 'Refilado', 'Laminado'] }],
    preco: v => ADESIVO_PRECOS.Vinil[v.acab] ?? null,
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

export const CATALOGO: Produto[] = [...MULTI, ...MEDIDA, ...SIMPLES];

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
