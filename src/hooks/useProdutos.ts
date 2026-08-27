import { useEffect, useMemo, useState } from 'react';
import { LINKS, MULTI, MEDIDA, SIMPLES, type Produto, type Categoria } from '../data';
import { listLojaProducts } from '../services/productsService';

// Produtos simples vêm do banco (sincronizado do ERP) — se a busca falhar
// por qualquer motivo, cai pro catálogo fixo em vez de mostrar vitrine vazia.
// Extraído de Catalogo.tsx pra ser reaproveitado também pela página de
// produto (/produto/:id), sem duplicar essa lógica.
export function useProdutos() {
  const [simples, setSimples] = useState(SIMPLES);

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
  }, []);

  const catalogo: Produto[] = useMemo(() => [...LINKS, ...MULTI, ...MEDIDA, ...simples], [simples]);

  return { catalogo, simples };
}
