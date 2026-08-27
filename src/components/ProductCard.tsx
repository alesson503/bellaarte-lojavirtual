import { useState } from 'react';
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

export default function ProductCard({
  produto,
  onAdd,
  onGoPersonalize,
  onOpenDetalhe,
}: {
  produto: Produto;
  onAdd: (nome: string, preco: number) => void;
  onGoPersonalize: (scrollToId: 'adesivos' | 'cartoes') => void;
  onOpenDetalhe: (produto: Extract<Produto, { tipo: 'simples' }>) => void;
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

  if (produto.tipo === 'multi') {
    return <MultiCard produto={produto} onAdd={onAdd} />;
  }

  if (produto.tipo === 'medida') {
    return <MedidaCard produto={produto} onAdd={onAdd} />;
  }

  return (
    <div className="prod-card prod-card-click" onClick={() => onOpenDetalhe(produto)}>
      <div className="prod-thumb" data-cat={produto.categoria}>
        <span className="cat-tag">{produto.categoria}</span>
        {produto.descontoPercentual ? <span className="badge-multi">-{produto.descontoPercentual}%</span> : null}
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="prod-thumb-img" />
        ) : (
          <CategoryIcon categoria={produto.categoria} />
        )}
      </div>
      <div className="prod-body">
        <b className="name">{produto.nome}</b>
        <div className="price-row">
          <PriceTag preco={produto.preco} precoOriginal={produto.precoOriginal} unidade={produto.unidade} />
        </div>
        <button className="add-btn" onClick={e => { e.stopPropagation(); onOpenDetalhe(produto); }}>Ver detalhes →</button>
      </div>
    </div>
  );
}

function MultiCard({ produto, onAdd }: { produto: Extract<Produto, { tipo: 'multi' }>; onAdd: (nome: string, preco: number) => void }) {
  const { fator, percentual } = usePromocao();
  const [sel, setSel] = useState<Record<string, string>>(
    () => Object.fromEntries(produto.dims.map(d => [d.key, d.options[0]])),
  );
  const precoCheio = produto.preco(sel);
  const preco = precoCheio != null ? precoCheio * fator : null;

  return (
    <div className="prod-card">
      <div className="prod-thumb" data-cat={produto.categoria}>
        <span className="cat-tag">{produto.categoria}</span>
        {percentual > 0 && <span className="badge-multi">-{percentual}%</span>}
        <CategoryIcon categoria={produto.categoria} />
      </div>
      <div className="prod-body">
        <b className="name">{produto.nome}</b>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {produto.dims.map(d => (
            <div key={d.key}>
              <label className="field-label" style={{ marginBottom: 5 }}>{d.label}</label>
              <div className="swatch-row">
                {d.options.map(op => (
                  <button
                    key={op}
                    className={`swatch ${sel[d.key] === op ? 'on' : ''}`}
                    style={{ padding: '6px 11px', fontSize: 11.5 }}
                    onClick={() => setSel(prev => ({ ...prev, [d.key]: op }))}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="price-row">
          {preco == null ? (
            <div className="p">combinação indisponível</div>
          ) : (
            <PriceTag preco={preco} precoOriginal={percentual > 0 ? precoCheio! : undefined} unidade={produto.unidade} />
          )}
        </div>
        <button
          className="add-btn" disabled={preco == null}
          onClick={() => preco != null && onAdd(`${produto.nome} (${produto.dims.map(d => sel[d.key]).join(' · ')})`, preco)}
        >
          Adicionar ao pedido
        </button>
      </div>
    </div>
  );
}

function MedidaCard({ produto, onAdd }: { produto: Extract<Produto, { tipo: 'medida' }>; onAdd: (nome: string, preco: number) => void }) {
  const { fator, percentual } = usePromocao();
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);
  const m2 = Math.max(0.1, larg) * Math.max(0.1, alt);
  const precoCheio = m2 * produto.precoM2;
  const preco = precoCheio * fator;

  return (
    <div className="prod-card">
      <div className="prod-thumb" data-cat={produto.categoria}>
        <span className="cat-tag">{produto.categoria}</span>
        {percentual > 0 && <span className="badge-multi">-{percentual}%</span>}
        <CategoryIcon categoria={produto.categoria} />
      </div>
      <div className="prod-body">
        <b className="name">{produto.nome}</b>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label" style={{ marginBottom: 5 }}>Largura (m)</label>
            <input
              type="number" min={0.1} step={0.1} value={larg}
              onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              style={{ width: '100%', height: 36, borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '0 10px', fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="field-label" style={{ marginBottom: 5 }}>Altura (m)</label>
            <input
              type="number" min={0.1} step={0.1} value={alt}
              onChange={e => setAlt(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              style={{ width: '100%', height: 36, borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '0 10px', fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 700 }}
            />
          </div>
        </div>
        <div className="price-row">
          <div>
            <div className="from">{m2.toFixed(2).replace('.', ',')} m² · {fmt(produto.precoM2)}/m²</div>
            <PriceTag preco={preco} precoOriginal={percentual > 0 ? precoCheio : undefined} />
          </div>
        </div>
        <button
          className="add-btn"
          onClick={() => onAdd(`${produto.nome} (${larg.toFixed(2).replace('.', ',')}m × ${alt.toFixed(2).replace('.', ',')}m = ${m2.toFixed(2).replace('.', ',')}m²)`, preco)}
        >
          Adicionar ao pedido
        </button>
      </div>
    </div>
  );
}
