import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProdutos } from '../hooks/useProdutos';
import { SearchIcon } from '../icons';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';

// Página de verdade pra vitrine (era a seção "produtos" dentro de
// StoreApp/Catalogo). Filtro de categoria vem da URL (?categoria=...) pra
// o card de categoria da Home poder linkar direto pra cá.
export default function Vitrine() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = searchParams.get('categoria') ?? 'Todos';
  const [busca, setBusca] = useState(searchParams.get('busca') ?? '');
  const { catalogo } = useProdutos();
  const { addToCart } = useCart();

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
          <div className="section-head reveal in">
            <div className="kicker">Catálogo</div>
            <h2 className="serif">Catálogo completo</h2>
            <p>Produtos com preço direto do nosso sistema — escolhe a opção e o preço muda na hora.</p>
          </div>

          <div className="toolbar reveal in">
            <div className="search-box">
              <SearchIcon />
              <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <div className="pills">
              {categorias.map(cat => {
                const count = cat === 'Todos' ? catalogo.length : catalogo.filter(p => p.categoria === cat).length;
                return (
                  <button key={cat} className={`pill ${filtro === cat ? 'on' : ''}`} onClick={() => setFiltro(cat)}>
                    {cat} <span className="n">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="result-count">{filtrados.length} produto{filtrados.length !== 1 ? 's' : ''}</div>

          <div className="gallery">
            {filtrados.length ? (
              filtrados.map((p, i) => (
                <ProductCard
                  key={('id' in p ? p.id : p.nome) + i}
                  produto={p}
                  onAdd={addToCart}
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
      </section>
      <Footer />
    </>
  );
}
