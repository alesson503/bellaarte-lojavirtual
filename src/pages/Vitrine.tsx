import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Página de verdade pra vitrine (era a seção "produtos" dentro de
// StoreApp/Catalogo). Filtro de categoria vem da URL (?categoria=...) pra
// o card de categoria da Home poder linkar direto pra cá. Visual: sidebar +
// grid do protótipo `loja-virtual` (catalogo.tsx).
export default function Vitrine() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = searchParams.get('categoria') ?? 'Todos';
  const [busca, setBusca] = useState(searchParams.get('busca') ?? '');
  const { catalogo } = useProdutos();

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(catalogo.map(p => p.categoria))).sort()], [catalogo]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.filter(p => {
      const okCat = filtro === 'Todos' || p.categoria === filtro;
      const okBusca = !termo || p.nome.toLowerCase().includes(termo);
      return okCat && okBusca;
    });
  }, [catalogo, filtro, busca]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  function setFiltro(cat: string) {
    const next = new URLSearchParams(searchParams);
    if (cat === 'Todos') next.delete('categoria');
    else next.set('categoria', cat);
    setSearchParams(next);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="mx-auto w-full max-w-[1720px] flex-1 px-4 pb-0 pt-8 md:px-8">
        <div className="mb-3 text-xs text-faint">
          <span className="cursor-pointer" onClick={() => navigate('/')}>Início</span> / Produtos
        </div>

        <div className="flex flex-col items-start gap-8 lg:flex-row">
          <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-60 lg:self-start">
            <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-rose"
              />
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-widest text-ink-muted">Categoria</p>
              <ul className="space-y-1">
                {categorias.map(cat => (
                  <li key={cat}>
                    <button
                      onClick={() => setFiltro(cat)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${filtro === cat ? 'bg-rose text-white shadow-sm' : 'text-ink-soft hover:bg-rose-50 hover:text-rose'}`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h1 className="font-display text-3xl font-extrabold text-ink">{filtro === 'Todos' ? 'Todos os produtos' : filtro}</h1>
              <span className="shrink-0 text-sm text-ink-muted">{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</span>
            </div>

            {filtrados.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
                {filtrados.map((p, i) => (
                  <ProductCard
                    key={('id' in p ? p.id : p.nome) + i}
                    produto={p}
                    index={i}
                    onOpenDetalhe={produto => navigate(`/produto/${encodeURIComponent(produto.nome)}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-16 text-center text-ink-muted">Nenhum produto encontrado. 🌸</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
