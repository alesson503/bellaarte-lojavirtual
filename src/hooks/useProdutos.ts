import { useEffect, useMemo, useState } from 'react';
import { MULTI, MEDIDA, SIMPLES, type Produto, type Categoria, type SimpleProduct, type MultiProduct } from '../data';
import { listLojaProducts, listCatalogoFixoImagens } from '../services/productsService';

// Alguns produtos vêm do ERP como vários itens soltos — um por combinação
// de opção (ex.: Tamanho x Blackout, ou Quantidade x Impressão). Aqui a
// gente detecta o padrão no nome e junta tudo num produto "multi" só —
// preço E foto de cada combinação vêm direto do que já está cadastrado
// (cada item mantém sua própria foto, trocada conforme a escolha na
// página do produto). Sem inventar nada; se o ERP não tiver esses nomes
// (ambiente local, ou o nome mudar lá), cai pro fixo de `MULTI` como
// reserva.
function agruparPorNome(
  produtos: SimpleProduct[],
  regex: RegExp,
  extrair: (m: RegExpMatchArray) => Record<string, string>,
  config: { id: string; nome: string; dims: { key: string; label: string; ordem: string[] }[] },
): { restantes: SimpleProduct[]; grupo: MultiProduct | null } {
  const restantes: SimpleProduct[] = [];
  const precos: Record<string, number> = {};
  const fotos: Record<string, string> = {};
  const presentes: Record<string, Set<string>> = {};
  let categoria: Categoria | null = null;
  let fotoGeral: string | undefined;

  const chaveDe = (v: Record<string, string>) => config.dims.map(d => v[d.key]).join('|');

  for (const p of produtos) {
    const m = p.nome.match(regex);
    if (!m) { restantes.push(p); continue; }
    const valores = extrair(m);
    const chave = chaveDe(valores);
    precos[chave] = p.preco;
    if (p.imagem) fotos[chave] = p.imagem;
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
    imagem: fotoGeral,
    dims: config.dims.map(d => ({ key: d.key, label: d.label, options: d.ordem.filter(v => presentes[d.key]?.has(v)) })),
    preco: v => precos[chaveDe(v)] ?? null,
    fotoPorCombo: v => fotos[chaveDe(v)],
  };
  return { restantes, grupo };
}

// Conferido direto na API de produção em 2026-09-26: 8 itens tipo
// "Wind Banner(G) C/Blackout" / "Wind Banner(M) S/blackout" (a caixa de
// "Blackout" varia no cadastro real, por isso o /i).
const WIND_BANNER_RE = /wind\s*banner\s*\(\s*(p|m|gg|g)\s*\)\s*(c|s)\s*\/\s*blackout/i;

function agruparWindBanner(produtos: SimpleProduct[]) {
  return agruparPorNome(
    produtos, WIND_BANNER_RE,
    m => ({ tam: m[1].toUpperCase(), bk: m[2].toUpperCase() === 'C' ? 'Com' : 'Sem' }),
    { id: 'windbanner', nome: 'Wind Banner', dims: [
      { key: 'tam', label: 'Tamanho', ordem: ['P', 'M', 'G', 'GG'] },
      { key: 'bk', label: 'Blackout', ordem: ['Sem', 'Com'] },
    ] },
  );
}

// Conferido direto na API de produção: 12 itens tipo "1000 Cartão Duplo
// 4x0" / "500 Cartão duplo  4X1" (o nome real é "Cartão Duplo", não
// "Cartão de Visita" — e não existe opção de verniz no cadastro real).
const CARTAO_DUPLO_RE = /^\s*(\d+)\s*cart[aã]o\s*duplo\s*(4x0|4x1|4x4)/i;

function agruparCartaoDuplo(produtos: SimpleProduct[]) {
  return agruparPorNome(
    produtos, CARTAO_DUPLO_RE,
    m => ({ qtd: m[1], imp: m[2].toLowerCase() }),
    { id: 'cartao-duplo', nome: 'Cartão Duplo', dims: [
      { key: 'qtd', label: 'Quantidade', ordem: ['100', '250', '500', '1000'] },
      { key: 'imp', label: 'Impressão', ordem: ['4x0', '4x1', '4x4'] },
    ] },
  );
}

// Produtos simples vêm do banco (sincronizado do ERP) — se a busca falhar
// por qualquer motivo, cai pro catálogo fixo em vez de mostrar vitrine vazia.
// Extraído de Catalogo.tsx pra ser reaproveitado também pela página de
// produto (/produto/:id), sem duplicar essa lógica.
export function useProdutos() {
  const [simples, setSimples] = useState(SIMPLES);
  const [imagensFixo, setImagensFixo] = useState<Record<string, string>>({});

  useEffect(() => {
    listLojaProducts()
      .then(produtos => {
        if (produtos.length === 0) return; // ERP ainda não sincronizou — mantém o fallback
        setSimples(produtos.map(p => ({
          tipo: 'simples' as const,
          nome: p.nome,
          categoria: p.categoria as Categoria,
          preco: p.preco,
          unidade: p.unidade ?? undefined,
          imagem: p.imagem_url ?? undefined,
          precoOriginal: p.desconto_percentual > 0 ? p.preco_original : undefined,
          descontoPercentual: p.desconto_percentual > 0 ? p.desconto_percentual : undefined,
          descricao: p.descricao ?? undefined,
          cores: p.cores?.length ? p.cores : undefined,
          especificacoes: p.especificacoes?.length ? p.especificacoes : undefined,
        })));
      })
      .catch(() => { /* mantém o catálogo fixo (fallback) */ });

    // Fotos dos produtos "multi"/"medida" (Panfletos, Placa PS, Banner/Lona)
    // — opcional, sobem pelo painel admin; sem foto, o card continua
    // mostrando o ícone da categoria, igual sempre foi.
    listCatalogoFixoImagens().then(setImagensFixo).catch(() => { /* mantém sem foto */ });
  }, []);

  const catalogo: Produto[] = useMemo(() => {
    const wind = agruparWindBanner(simples);
    const { restantes, grupo: grupoCartao } = agruparCartaoDuplo(wind.restantes);
    const grupos = [wind.grupo, grupoCartao].filter((g): g is MultiProduct => g != null);
    const idsSubstituidos = new Set(grupos.map(g => g.id));
    return [
      ...MULTI.filter(p => !idsSubstituidos.has(p.id)).map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
      ...grupos,
      ...MEDIDA.map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
      ...restantes,
    ];
  }, [simples, imagensFixo]);

  return { catalogo, simples };
}
