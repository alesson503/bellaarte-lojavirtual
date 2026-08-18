import { useEffect, useMemo, useState } from 'react';
import { LINKS, MULTI, MEDIDA, SIMPLES, type Produto, type Categoria } from '../data';
import { listLojaProducts } from '../services/productsService';
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
  // Produtos simples vêm do banco (sincronizado do ERP) — se a busca falhar
  // por qualquer motivo, cai pro catálogo fixo em vez de mostrar vitrine vazia.
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
        })));
      })
      .catch(() => { /* mantém o catálogo fixo (fallback) */ });
  }, []);

  const catalogo: Produto[] = useMemo(() => [...LINKS, ...MULTI, ...MEDIDA, ...simples], [simples]);
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
