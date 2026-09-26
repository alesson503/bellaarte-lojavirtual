import { useEffect, useMemo, useState } from 'react';
import { MULTI, MEDIDA, SIMPLES, type Produto, type Categoria, type SimpleProduct, type MultiProduct } from '../data';
import { listLojaProducts, listCatalogoFixoImagens } from '../services/productsService';

// "Bandeira de Vento" vem do ERP como 8 produtos soltos — um por combinação
// de Tamanho (P/M/G/GG) x Blackout (Com/Sem), cada um com nome tipo
// "Bandeira de Vento (G) C/Blackout" ou "Bandeira do Vento (GG) S/blackout"
// (o "de"/"do" e a caixa de "Blackout" variam no cadastro real). Aqui a
// gente detecta esse padrão e junta os 8 num produto "multi" só — preço
// de cada combinação vem direto do que já está cadastrado, sem inventar
// nada. Se algum dia parar de vir do ERP (ou mudar o nome lá), a loja cai
// pro Wind Banner fixo de `MULTI` como reserva.
const BANDEIRA_VENTO_RE = /bandeira\s+(?:de|do)\s+vento\s*\(\s*(p|m|gg|g)\s*\)\s*(c|s)\s*\/\s*blackout/i;

function agruparBandeiraDeVento(produtos: SimpleProduct[]): { restantes: SimpleProduct[]; grupo: MultiProduct | null } {
  const restantes: SimpleProduct[] = [];
  const precos: Record<string, Record<string, number>> = {};
  let categoria: Categoria | null = null;
  let foto: string | undefined;

  for (const p of produtos) {
    const m = p.nome.match(BANDEIRA_VENTO_RE);
    if (!m) { restantes.push(p); continue; }
    const tam = m[1].toUpperCase();
    const bk = m[2].toUpperCase() === 'C' ? 'Com' : 'Sem';
    precos[tam] = precos[tam] || {};
    precos[tam][bk] = p.preco;
    categoria = categoria ?? p.categoria;
    foto = foto ?? p.imagem;
  }

  if (!categoria) return { restantes, grupo: null };

  const tamanhosPresentes = (['P', 'M', 'G', 'GG'] as const).filter(t => precos[t]);
  const grupo: MultiProduct = {
    tipo: 'multi',
    id: 'bandeira-de-vento',
    nome: 'Bandeira de Vento',
    categoria,
    imagem: foto,
    dims: [
      { key: 'tam', label: 'Tamanho', options: tamanhosPresentes },
      { key: 'bk', label: 'Blackout', options: ['Sem', 'Com'] },
    ],
    preco: v => precos[v.tam]?.[v.bk] ?? null,
  };
  return { restantes, grupo };
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

    // Fotos dos produtos "multi"/"medida" (Panfletos, Wind Banner, Placa PS,
    // Banner/Lona) — opcional, sobem pelo painel admin; sem foto, o card
    // continua mostrando o ícone da categoria, igual sempre foi.
    listCatalogoFixoImagens().then(setImagensFixo).catch(() => { /* mantém sem foto */ });
  }, []);

  const catalogo: Produto[] = useMemo(() => {
    const { restantes, grupo } = agruparBandeiraDeVento(simples);
    return [
      ...MULTI.filter(p => p.id !== 'windbanner' || !grupo).map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
      ...(grupo ? [grupo] : []),
      ...MEDIDA.map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
      ...restantes,
    ];
  }, [simples, imagensFixo]);

  return { catalogo, simples };
}
