import { useState } from 'react';
import type { Produto } from '../data';
import { fmt } from '../data';
import { CategoryIcon } from '../icons';

export default function ProductCard({
  produto,
  onAdd,
  onGoPersonalize,
}: {
  produto: Produto;
  onAdd: (nome: string, preco: number) => void;
  onGoPersonalize: (scrollToId: 'adesivos' | 'cartoes') => void;
}) {
  if (produto.tipo === 'link') {
    return (
      <div className="prod-card">
        <div className="prod-thumb">
          <span className="cat-tag">{produto.categoria}</span>
          <CategoryIcon categoria={produto.categoria} />
        </div>
        <div className="prod-body">
          <b className="name">{produto.nome}</b>
          <div className="price-row">
            <div>
              <div className="from">a partir de</div>
              <div className="p">{fmt(produto.desde)}{produto.unidade && <small> /{produto.unidade}</small>}</div>
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
    <div className="prod-card">
      <div className="prod-thumb">
        <span className="cat-tag">{produto.categoria}</span>
        <CategoryIcon categoria={produto.categoria} />
      </div>
      <div className="prod-body">
        <b className="name">{produto.nome}</b>
        <div className="price-row">
          <div className="p">{fmt(produto.preco)}{produto.unidade && <small> /{produto.unidade}</small>}</div>
        </div>
        <button className="add-btn" onClick={() => onAdd(produto.nome, produto.preco)}>Adicionar ao pedido</button>
      </div>
    </div>
  );
}

function MultiCard({ produto, onAdd }: { produto: Extract<Produto, { tipo: 'multi' }>; onAdd: (nome: string, preco: number) => void }) {
  const [sel, setSel] = useState<Record<string, string>>(
    () => Object.fromEntries(produto.dims.map(d => [d.key, d.options[0]])),
  );
  const preco = produto.preco(sel);

  return (
    <div className="prod-card">
      <div className="prod-thumb">
        <span className="cat-tag">{produto.categoria}</span>
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
          <div className="p">
            {preco == null ? 'combinação indisponível' : <>{fmt(preco)}{produto.unidade && <small> /{produto.unidade}</small>}</>}
          </div>
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
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);
  const m2 = Math.max(0.1, larg) * Math.max(0.1, alt);
  const preco = m2 * produto.precoM2;

  return (
    <div className="prod-card">
      <div className="prod-thumb">
        <span className="cat-tag">{produto.categoria}</span>
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
            <div className="p">{fmt(preco)}</div>
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
