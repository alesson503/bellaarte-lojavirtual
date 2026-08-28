import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import { SearchIcon } from '../icons';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Página de verdade pra vitrine (era a seção "produtos" dentro de
// StoreApp/Catalogo). Filtro de categoria vem da URL (?categoria=...) pra
// o card de categoria da Home poder linkar direto pra cá.
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

  function onGoPersonalize(scrollToId: 'adesivos' | 'cartoes') {
    navigate('/', { state: { scrollTo: scrollToId } });
  }

  return (
    <>
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <section id="catalogo" className="band">
        <div className="shell">
          <div className="crumbs"><span className="link" onClick={() => navigate('/')}>Início</span> / <span className="now">Produtos</span></div>
          <div className="cat-layout">
            <div>
              <input className="side-search" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
              <div className="side-title">Categoria</div>
              <div className="side-list">
                {categorias.map(cat => (
                  <button key={cat} className={filtro === cat ? 'on' : ''} onClick={() => setFiltro(cat)}>{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title-row">
                <h2 className="serif">Todos os produtos</h2>
                <span className="result-count">{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="gallery cat-layout-grid">
                {filtrados.length ? (
                  filtrados.map((p, i) => (
                    <ProductCard
                      key={('id' in p ? p.id : p.nome) + i}
                      produto={p}
                      onGoPersonalize={onGoPersonalize}
                      onOpenDetalhe={produto => navigate(`/produto/${encodeURIComponent(produto.nome)}`)}
                    />
                  ))
                ) : (
                  <div className="empty">
                    <SearchIcon />
                    Nenhum produto encontrado com esse filtro.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
