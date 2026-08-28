import { useEffect, useMemo, useState } from 'react';
import { LINKS, MULTI, MEDIDA, SIMPLES, type Produto, type Categoria } from '../data';
import { listLojaProducts, listCatalogoFixoImagens } from '../services/productsService';

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

  const catalogo: Produto[] = useMemo(() => [
    ...LINKS,
    ...MULTI.map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
    ...MEDIDA.map(p => ({ ...p, imagem: imagensFixo[p.id] ?? p.imagem })),
    ...simples,
  ], [simples, imagensFixo]);

  return { catalogo, simples };
}
