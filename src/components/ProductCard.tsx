import type { Produto } from '../data';
import { fmt } from '../data';
import { CategoryIcon } from '../icons';
import { usePromocao } from '../context/PromocaoContext';

// Preço atual + (opcional) preço riscado e selo de desconto — usado em
// todos os tipos de produto pra manter a mesma cara.
function PriceTag({ preco, precoOriginal, unidade }: { preco: number; precoOriginal?: number; unidade?: string }) {
  const temDesconto = precoOriginal != null && precoOriginal > preco;
  return (
    <div className="p">
      {temDesconto && <span className="old-price">{fmt(precoOriginal)}</span>}
      {fmt(preco)}{unidade && <small> /{unidade}</small>}
    </div>
  );
}

// Menor preço entre todas as combinações de opções — só pra mostrar "a
// partir de" no card do catálogo (a escolha de verdade acontece na página
// de detalhe). Produto com poucas dimensões/opções, então força-bruta é ok.
function precoMinimoMulti(produto: Extract<Produto, { tipo: 'multi' }>): number | null {
  let combos: Record<string, string>[] = [{}];
  for (const d of produto.dims) {
    combos = combos.flatMap(c => d.options.map(op => ({ ...c, [d.key]: op })));
  }
  const precos = combos.map(c => produto.preco(c)).filter((p): p is number => p != null);
  return precos.length ? Math.min(...precos) : null;
}

export default function ProductCard({
  produto,
  onGoPersonalize,
  onOpenDetalhe,
}: {
  produto: Produto;
  onGoPersonalize: (scrollToId: 'adesivos' | 'cartoes') => void;
  onOpenDetalhe: (produto: Exclude<Produto, { tipo: 'link' }>) => void;
}) {
  const { fator, percentual } = usePromocao();

  if (produto.tipo === 'link') {
    const desdeComPromo = produto.desde * fator;
    return (
      <div className="prod-card">
        <div className="prod-thumb" data-cat={produto.categoria}>
          <span className="cat-tag">{produto.categoria}</span>
          {percentual > 0 && <span className="badge-multi">-{percentual}%</span>}
          <CategoryIcon categoria={produto.categoria} />
        </div>
        <div className="prod-body">
          <b className="name">{produto.nome}</b>
          <div className="price-row">
            <div>
              <div className="from">a partir de</div>
              <PriceTag preco={desdeComPromo} precoOriginal={percentual > 0 ? produto.desde : undefined} unidade={produto.unidade} />
            </div>
          </div>
          <button className="add-btn" onClick={() => onGoPersonalize(produto.target)}>Personalizar e ver preço →</button>
        </div>
      </div>
    );
  }

  // multi, medida e simples viram todos o mesmo card enxuto: foto + nome +
  // "a partir de" + botão que abre a página de detalhe — é lá que a
  // quantidade/cor/tamanho/medida são escolhidas (antes ficava tudo aqui
  // dentro, mas o card ficava poluído e diferente do resto da loja).
  let precoExibido: number | null;
  let unidade: string | undefined;
  if (produto.tipo === 'multi') {
    const minCheio = precoMinimoMulti(produto);
    precoExibido = minCheio != null ? minCheio * fator : null;
    unidade = produto.unidade;
  } else if (produto.tipo === 'medida') {
    precoExibido = produto.precoM2 * fator;
    unidade = 'm²';
  } else {
    precoExibido = produto.preco;
    unidade = produto.unidade;
  }

  return (
    <div className="prod-card prod-card-click" onClick={() => onOpenDetalhe(produto)}>
      <div className="prod-thumb" data-cat={produto.categoria}>
        <span className="cat-tag">{produto.categoria}</span>
        {produto.tipo === 'simples' && produto.descontoPercentual ? <span className="badge-multi">-{produto.descontoPercentual}%</span> : null}
        {produto.tipo !== 'simples' && percentual > 0 ? <span className="badge-multi">-{percentual}%</span> : null}
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="prod-thumb-img" />
        ) : (
          <CategoryIcon categoria={produto.categoria} />
        )}
      </div>
      <div className="prod-body">
        <b className="name">{produto.nome}</b>
        <div className="price-row">
          {produto.tipo === 'simples' ? (
            <PriceTag preco={produto.preco} precoOriginal={produto.precoOriginal} unidade={produto.unidade} />
          ) : precoExibido == null ? (
            <div className="p">combinação indisponível</div>
          ) : (
            <div>
              <div className="from">a partir de</div>
              <PriceTag preco={precoExibido} unidade={unidade} />
            </div>
          )}
        </div>
        <button className="add-btn" onClick={e => { e.stopPropagation(); onOpenDetalhe(produto); }}>Ver detalhe →</button>
      </div>
    </div>
  );
}
