import { useMemo, useState } from 'react';
import { CATALOGO, CATEGORIAS } from '../data';
import { SearchIcon } from '../icons';
import ProductCard from './ProductCard';

export default function Catalogo({
  onAdd,
  onGoPersonalize,
  filtroInicial,
}: {
  onAdd: (nome: string, preco: number) => void;
  onGoPersonalize: (scrollToId: 'adesivos' | 'cartoes') => void;
  filtroInicial: string;
}) {
  const [filtro, setFiltro] = useState(filtroInicial);
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return CATALOGO.filter(p => {
      const okCat = filtro === 'Todos' || p.categoria === filtro;
      const okBusca = !termo || p.nome.toLowerCase().includes(termo);
      return okCat && okBusca;
    });
  }, [filtro, busca]);

  return (
    <section id="catalogo" className="band">
      <div className="shell">
        <div className="section-head reveal in">
          <div className="kicker">Prévia com dados reais</div>
          <h2 className="serif">Catálogo completo</h2>
          <p>Todos os 60 produtos já cadastrados no seu sistema, agrupados por variação (tamanho, quantidade, acabamento) — escolhe a opção e o preço muda na hora.</p>
        </div>

        <div className="insight reveal in">
          <span>💡</span>
          <span>
            <b>Reparei uma coisa:</b> vários produtos (a maioria dos Panfletos, o Banner/Lona avulso e 2 tipos de Adesivo) estão sem categoria
            definida no sistema — vim marcados como "—" na tela de Produtos. Não atrapalha essa prévia porque eu agrupei manualmente, mas vale
            preencher a categoria de cada um lá no sistema real pra quando a loja filtrar por categoria, funcionar certinho sozinha.
          </span>
        </div>

        <div className="toolbar reveal in">
          <div className="search-box">
            <SearchIcon />
            <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <div className="pills">
            {CATEGORIAS.map(cat => {
              const count = cat === 'Todos' ? CATALOGO.length : CATALOGO.filter(p => p.categoria === cat).length;
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
            filtrados.map((p, i) => <ProductCard key={('id' in p ? p.id : p.nome) + i} produto={p} onAdd={onAdd} onGoPersonalize={onGoPersonalize} />)
          ) : (
            <div className="empty">
              <SearchIcon />
              Nenhum produto encontrado com esse filtro.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
