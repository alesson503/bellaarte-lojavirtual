import { useMemo, useState } from 'react';
import type { SimpleProduct } from '../data';
import { useProdutos } from '../hooks/useProdutos';
import { SearchIcon } from '../icons';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';

export default function Catalogo({
  onAdd,
  onComprarAgora,
  onGoPersonalize,
  filtroInicial,
  whatsapp,
}: {
  onAdd: (nome: string, preco: number) => void;
  onComprarAgora: (nome: string, preco: number, quantidade?: number, observacao?: string) => void;
  onGoPersonalize: (scrollToId: 'adesivos' | 'cartoes') => void;
  filtroInicial: string;
  whatsapp: string;
}) {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [busca, setBusca] = useState('');
  const [detalhe, setDetalhe] = useState<SimpleProduct | null>(null);
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

  return (
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
                onAdd={onAdd}
                onGoPersonalize={onGoPersonalize}
                onOpenDetalhe={setDetalhe}
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
      <ProductDetailModal produto={detalhe} onClose={() => setDetalhe(null)} onAdd={onAdd} onComprarAgora={onComprarAgora} whatsapp={whatsapp} />
    </section>
  );
}
