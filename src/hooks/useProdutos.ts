import { useEffect, useMemo, useState } from 'react';
import { type Produto, type SimpleProduct, type MultiProduct, type MedidaProduct } from '../data';
import { listLojaProducts, listCatalogoFixoImagens } from '../services/productsService';

// Todo o catálogo vem do ERP. Alguns produtos vêm de lá como vários itens
// soltos — um por combinação de opção (ex.: Quantidade x Impressão). Aqui
// a gente detecta o padrão no nome e junta tudo num produto "multi" só —
// preço, foto e id do ERP de cada combinação vêm direto do cadastro.
//
// O preço guardado no grupo é o CHEIO (sem desconto): a página do produto
// e o card aplicam a promoção geral por cima (`fator`), igual já faziam.

interface GrupoConfig {
  id: string;
  nome: string;
  dims: { key: string; label: string; ordem: string[] }[];
  porM2?: boolean;
}

function agruparPorNome(
  produtos: SimpleProduct[],
  regex: RegExp,
  extrair: (m: RegExpMatchArray) => Record<string, string> | null,
  config: GrupoConfig,
): { restantes: SimpleProduct[]; grupo: MultiProduct | null } {
  const restantes: SimpleProduct[] = [];
  const precos: Record<string, number> = {};
  const fotos: Record<string, string> = {};
  const erpIds: Record<string, string> = {};
  const presentes: Record<string, Set<string>> = {};
  let categoria: string | null = null;
  let fotoGeral: string | undefined;

  const chaveDe = (v: Record<string, string>) => config.dims.map(d => v[d.key]).join('|');

  for (const p of produtos) {
    const m = p.nome.match(regex);
    const valores = m ? extrair(m) : null;
    if (!valores) { restantes.push(p); continue; }
    const chave = chaveDe(valores);
    precos[chave] = p.precoOriginal ?? p.preco;
    if (p.imagem) fotos[chave] = p.imagem;
    if (p.erpId) erpIds[chave] = p.erpId;
    categoria = categoria ?? p.categoria;
    fotoGeral = fotoGeral ?? p.imagem;
    for (const d of config.dims) {
      (presentes[d.key] ??= new Set()).add(valores[d.key]);
    }
  }

  if (!categoria) return { restantes, grupo: null };

  const grupo: MultiProduct = {
    tipo: 'multi',
    id: config.id,
    nome: config.nome,
    categoria,
    unidade: config.porM2 ? 'm²' : undefined,
    porM2: config.porM2,
    imagem: fotoGeral,
    // Opção que não existe no ERP some do seletor (ex.: verniz só aparece
    // se tiver algum item "C/verniz" cadastrado).
    dims: config.dims
      .map(d => ({ key: d.key, label: d.label, options: d.ordem.filter(v => presentes[d.key]?.has(v)) }))
      .filter(d => d.options.length > 0),
    preco: v => precos[chaveDe(v)] ?? null,
    fotoPorCombo: v => fotos[chaveDe(v)],
    erpIdPorCombo: v => erpIds[chaveDe(v)],
  };
  return { restantes, grupo };
}

// "2,500" / "2.500" / "2500" → "2.500" (mesmo rótulo que aparece no botão).
const qtdLabel = (s: string) => Number(s.replace(/[.,]/g, '')).toLocaleString('pt-BR');

// Nomes conferidos direto no ERP de produção em 2026-09-26. O cadastro tem
// variações de digitação ("500N", "2,500UN", "S/blackout", espaço duplo),
// por isso os regex são tolerantes.
const GRUPOS: { regex: RegExp; extrair: (m: RegExpMatchArray) => Record<string, string> | null; config: GrupoConfig }[] = [
  {
    // "Wind Banner(G) C/Blackout"
    regex: /wind\s*banner\s*\(\s*(p|m|gg|g)\s*\)\s*(c|s)\s*\/\s*blackout/i,
    extrair: m => ({ tam: m[1].toUpperCase(), bk: m[2].toUpperCase() === 'C' ? 'Com' : 'Sem' }),
    config: { id: 'windbanner', nome: 'Wind Banner', dims: [
      { key: 'tam', label: 'Tamanho', ordem: ['P', 'M', 'G', 'GG'] },
      { key: 'bk', label: 'Blackout', ordem: ['Sem', 'Com'] },
    ] },
  },
  {
    // "1000 Cartão Duplo 4x0" / "500 Cartão duplo  4X1"
    regex: /^\s*(\d+)\s*cart[aã]o\s*duplo\s*(4x0|4x1|4x4)/i,
    extrair: m => ({ qtd: qtdLabel(m[1]), imp: m[2].toLowerCase() }),
    config: { id: 'cartao-duplo', nome: 'Cartão Duplo', dims: [
      { key: 'qtd', label: 'Quantidade', ordem: ['100', '250', '500', '1.000'] },
      { key: 'imp', label: 'Impressão', ordem: ['4x0', '4x1', '4x4'] },
    ] },
  },
  {
    // "Cartão de Visita - 1000 uni C/verniz - 4x4" / "- 1000 S/verniz uni - 4x1"
    regex: /^\s*cart[aã]o\s+de\s+visita\b(.*)$/i,
    extrair: m => {
      const qtd = m[1].match(/(\d+)\s*(?:un|s\/|c\/)/i);
      const imp = m[1].match(/4x([014])/i);
      if (!qtd || !imp) return null;
      const verniz = /c\s*\/\s*verniz/i.test(m[1]) ? 'Com' : 'Sem';
      return { qtd: qtdLabel(qtd[1]), imp: `4x${imp[1]}`, verniz };
    },
    config: { id: 'cartao-visita', nome: 'Cartão de Visita', dims: [
      { key: 'qtd', label: 'Quantidade', ordem: ['100', '250', '500', '1.000'] },
      { key: 'imp', label: 'Impressão', ordem: ['4x0', '4x1', '4x4'] },
      { key: 'verniz', label: 'Verniz', ordem: ['Sem', 'Com'] },
    ] },
  },
  {
    // "Panfletos 100UN - 10x14 - C/4X0" / "Panfletos 500N - …" / "Panfletos 2,500UN - …"
    regex: /^\s*panfletos\s+([\d.,]+)\s*u?n\b.*10\s*x\s*14.*4x([04])/i,
    extrair: m => ({ qtd: qtdLabel(m[1]), cor: m[2] === '0' ? '4×0 (só frente)' : '4×4 (frente e verso)' }),
    config: { id: 'panfletos', nome: 'Panfletos (10×14cm)', dims: [
      { key: 'qtd', label: 'Quantidade', ordem: ['100', '250', '500', '1.000', '2.500', '5.000'] },
      { key: 'cor', label: 'Impressão', ordem: ['4×0 (só frente)', '4×4 (frente e verso)'] },
    ] },
  },
  {
    // "Placa PS 2mm solvente" / "Placa PS 2mm UV" — por m²
    regex: /^\s*placa\s*ps\s*(\d)\s*mm\s*(uv|solvente)/i,
    extrair: m => ({ esp: `${m[1]}mm`, imp: m[2].toLowerCase() === 'uv' ? 'UV' : 'Solvente' }),
    config: { id: 'placaps', nome: 'Placa PS', porM2: true, dims: [
      { key: 'esp', label: 'Espessura', ordem: ['1mm', '2mm', '3mm'] },
      { key: 'imp', label: 'Impressão', ordem: ['Solvente', 'UV'] },
    ] },
  },
  {
    // "Adesivo UV Recortado" — por m²
    regex: /^\s*adesivo\s+uv\s+(recortado|refilado|laminado)/i,
    extrair: m => ({ acab: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() }),
    config: { id: 'adesivo-uv', nome: 'Adesivo UV', porM2: true, dims: [
      { key: 'acab', label: 'Acabamento', ordem: ['Recortado', 'Refilado', 'Laminado'] },
    ] },
  },
  {
    // "Adesivo Vinil Recortado" — por m²
    regex: /^\s*adesivo\s+vinil\s+(recortado|refilado|laminado)/i,
    extrair: m => ({ acab: m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() }),
    config: { id: 'adesivo-vinil', nome: 'Adesivo Vinil', porM2: true, dims: [
      { key: 'acab', label: 'Acabamento', ordem: ['Recortado', 'Refilado', 'Laminado'] },
    ] },
  },
];

// id estável a partir do nome — "Banner / Lona" → "banner-lona" (mesmo id
// que a foto de capa já usava no painel admin).
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Produto do ERP vendido por m² ou por metro linear, que não caiu em
// nenhum grupo acima (ex.: Banner / Lona, DTF Têxtil) — vira uma ficha
// onde o cliente digita a medida.
function paraMedida(p: SimpleProduct): MedidaProduct | null {
  if (p.unidade !== 'm²' && p.unidade !== 'm') return null;
  return {
    tipo: 'medida',
    id: slug(p.nome),
    nome: p.nome,
    categoria: p.categoria,
    precoM2: p.precoOriginal ?? p.preco,
    linear: p.unidade === 'm',
    erpId: p.erpId,
    imagem: p.imagem,
  };
}

// Produtos importados do fornecedor no ERP já vêm marcados com o grupo
// ("Adesivo em Vinil 5x5") e a opção ("50 un") — viram 1 produto com seletor
// de Quantidade, sem precisar de regra de nome como os GRUPOS acima.
function agruparImportados(produtos: SimpleProduct[]): { grupos: MultiProduct[]; restantes: SimpleProduct[] } {
  const porGrupo = new Map<string, SimpleProduct[]>();
  const restantes: SimpleProduct[] = [];
  for (const p of produtos) {
    if (p.grupo && p.opcao) (porGrupo.get(p.grupo) ?? porGrupo.set(p.grupo, []).get(p.grupo)!).push(p);
    else restantes.push(p);
  }
  const numero = (o: string) => Number(o.replace(/\D/g, '')) || 0;
  const grupos: MultiProduct[] = [];
  for (const [nome, itens] of porGrupo) {
    const opcoes = [...new Set(itens.map(i => i.opcao!))].sort((a, b) => numero(a) - numero(b));
    const porOpcao = new Map(itens.map(i => [i.opcao!, i]));
    const primeiro = itens.find(i => i.imagem) ?? itens[0];
    grupos.push({
      tipo: 'multi',
      id: 'imp-' + slug(nome),
      nome,
      categoria: itens[0].categoria,
      imagem: primeiro.imagem,
      dims: [{ key: 'qtd', label: 'Quantidade', options: opcoes }],
      preco: v => { const i = porOpcao.get(v.qtd); return i ? (i.precoOriginal ?? i.preco) : null; },
      fotoPorCombo: v => porOpcao.get(v.qtd)?.imagem,
      erpIdPorCombo: v => porOpcao.get(v.qtd)?.erpId,
      especificacoes: primeiro.especificacoes,
    });
  }
  return { grupos, restantes };
}

// Montado em cima da lista que o ERP manda pra loja (sincronizada no
// servidor da loja a cada 30min). Sem fallback fixo: se a busca falhar, a
// vitrine fica vazia em vez de mostrar preço desatualizado.
export function useProdutos() {
  const [simples, setSimples] = useState<SimpleProduct[]>([]);
  const [imagensFixo, setImagensFixo] = useState<Record<string, string>>({});

  useEffect(() => {
    listLojaProducts()
      .then(produtos => {
        setSimples(produtos.map(p => ({
          tipo: 'simples' as const,
          nome: p.nome,
          erpId: p.erp_id ?? undefined,
          categoria: p.categoria,
          preco: p.preco,
          unidade: p.unidade ?? undefined,
          imagem: p.imagem_url ?? undefined,
          precoOriginal: p.desconto_percentual > 0 ? p.preco_original : undefined,
          descontoPercentual: p.desconto_percentual > 0 ? p.desconto_percentual : undefined,
          descricao: p.descricao ?? undefined,
          cores: p.cores?.length ? p.cores : undefined,
          // Especificação escrita na loja vale mais que a que veio do fornecedor.
          especificacoes: p.especificacoes?.length ? p.especificacoes : p.erp_especificacoes?.length ? p.erp_especificacoes : undefined,
          grupo: p.erp_grupo || undefined,
          opcao: p.erp_opcao || undefined,
        })));
      })
      .catch(() => { /* vitrine fica vazia */ });

    // Foto de capa dos grupos (Panfletos, Placa PS, Banner/Lona…) — opcional,
    // sobe pelo painel admin; sem ela, usa a foto do primeiro item do ERP.
    listCatalogoFixoImagens().then(setImagensFixo).catch(() => { /* mantém sem foto */ });
  }, []);

  const catalogo: Produto[] = useMemo(() => {
    const { grupos: importados, restantes: semGrupo } = agruparImportados(simples);
    let restantes = semGrupo;
    const grupos: MultiProduct[] = [...importados];
    for (const g of GRUPOS) {
      const r = agruparPorNome(restantes, g.regex, g.extrair, g.config);
      restantes = r.restantes;
      if (r.grupo) grupos.push(r.grupo);
    }
    const medidas: MedidaProduct[] = [];
    const avulsos: SimpleProduct[] = [];
    for (const p of restantes) {
      const med = paraMedida(p);
      if (med) medidas.push(med); else avulsos.push(p);
    }
    const comCapa = <T extends MultiProduct | MedidaProduct>(p: T): T => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem });
    return [...grupos.map(comCapa), ...medidas.map(comCapa), ...avulsos];
  }, [simples, imagensFixo]);

  return { catalogo, simples };
}
