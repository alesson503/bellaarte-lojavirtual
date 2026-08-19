import { useEffect, useMemo, useState, type RefObject } from 'react';
import { ADESIVO_PRECOS as ADESIVO_PRECOS_FALLBACK, fmt } from '../data';
import { getAdesivoPrecos } from '../services/productsService';
import { usePromocao } from '../context/PromocaoContext';
import { ArteUpload, ArteGuides, ArteLegend, ehImagem, type Arte } from './ArtePreview';
import type { ArteAnexo } from '../types';

type Tipo = 'UV' | 'Vinil';
type Acabamento = 'Recortado' | 'Refilado' | 'Laminado';
type Formato = 'circulo' | 'quadrado';

const QTY_PRESETS = [25, 50, 100, 250, 500, 1000];

export default function AdesivoConfigurator({
  onAdd,
  sectionRef,
}: {
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: { frente?: ArteAnexo; verso?: ArteAnexo } | null) => void;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  const [tipo, setTipo] = useState<Tipo>('UV');
  const [acab, setAcab] = useState<Acabamento>('Recortado');
  const [shape, setShape] = useState<Formato>('circulo');
  const [sizeCm, setSizeCm] = useState(5);
  const [qty, setQty] = useState(50);
  const [arte, setArte] = useState<Arte | null>(null);
  const { fator, percentual } = usePromocao();
  // Preço real do sistema — se a busca falhar, usa a tabela fixa como reserva.
  const [precos, setPrecos] = useState(ADESIVO_PRECOS_FALLBACK);
  useEffect(() => {
    getAdesivoPrecos().then(setPrecos).catch(() => { /* mantém a tabela fixa (fallback) */ });
  }, []);

  // Bobina: largura MÁXIMA de 1m (100cm), mas começa pequena — cresce em
  // largura primeiro (só usando o que precisar), e só depois de bater no
  // limite de 1m é que passa a crescer em comprimento (mais fileiras).
  const calc = useMemo(() => {
    const gap = 0.2;
    const cell = sizeCm + gap;
    const rollMaxWidthCm = 100;
    const maxPerRow = Math.max(1, Math.floor((rollMaxWidthCm + gap) / cell));
    let perRow: number, rowsNeeded: number, widthUsedCm: number;
    if (qty <= maxPerRow) {
      perRow = qty;
      rowsNeeded = 1;
      widthUsedCm = perRow * cell;
    } else {
      perRow = maxPerRow;
      rowsNeeded = Math.ceil(qty / perRow);
      widthUsedCm = rollMaxWidthCm;
    }
    const lengthNeededM = (rowsNeeded * cell) / 100;
    const widthUsedM = widthUsedCm / 100;
    const precoM2 = precos[tipo][acab];
    const totalCheio = widthUsedM * lengthNeededM * precoM2;
    const total = totalCheio * fator;
    return { perRow, rowsNeeded, widthUsedCm, lengthNeededM, widthUsedM, precoM2, totalCheio, total, rollMaxWidthCm };
  }, [sizeCm, qty, tipo, acab, precos, fator]);

  const maxPreviewPx = 180;
  const mockWidthPx = Math.max(48, Math.round((calc.widthUsedCm / calc.rollMaxWidthCm) * maxPreviewPx));
  const showCols = Math.min(calc.perRow, 6);
  const showRows = Math.min(calc.rowsNeeded, 9);
  const truncated = calc.rowsNeeded > showRows || calc.perRow > showCols;

  return (
    <section id="adesivos" className="band" ref={sectionRef}>
      <div className="shell">
        <div className="section-head reveal in">
          <div className="kicker">Monte o seu</div>
          <h2 className="serif">Adesivos, do seu jeito</h2>
          <p>Escolha o tipo, o acabamento, o formato e o tamanho — a gente calcula quanto sai da bobina (1m de largura, comprimento que for preciso) e o preço, usando o valor real por m² do sistema.</p>
        </div>
        <div className="configurator reveal in">
          <div className="cfg-preview">
            {arte && ehImagem(arte) ? (
              <>
                <div className={`art-box ${shape === 'circulo' ? 'circulo' : ''}`} style={{ width: 280, height: 280 }}>
                  <img src={arte.dataUrl} alt="Prévia da sua arte" />
                  <ArteGuides formato={shape} larguraMm={sizeCm * 10} alturaMm={sizeCm * 10} />
                </div>
                <ArteLegend />
              </>
            ) : (
              <div className="sheet-mock" style={{ width: mockWidthPx, gridTemplateColumns: `repeat(${showCols}, 1fr)` }}>
                {Array.from({ length: showCols * showRows }).map((_, i) => (
                  <div key={i} style={{ aspectRatio: '1', background: 'var(--violet)', opacity: 0.85, borderRadius: shape === 'circulo' ? '50%' : '3px' }} />
                ))}
                {truncated && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', fontSize: 10, color: 'var(--graphite-faint)', fontWeight: 700 }}>
                    + bobina continua ({calc.rowsNeeded} fileira{calc.rowsNeeded !== 1 ? 's' : ''} no total)
                  </div>
                )}
              </div>
            )}
            <div className="sheet-fit-note">
              <b>{calc.perRow}</b> por fileira{' '}
              <span>
                {calc.widthUsedCm >= calc.rollMaxWidthCm ? '(largura máxima de 1m)' : `(${calc.widthUsedCm.toFixed(0)}cm de largura, de 1m)`}
              </span>{' '}
              · comprimento: <b>{calc.lengthNeededM.toFixed(2).replace('.', ',')}</b> m
            </div>
          </div>
          <div className="cfg-fields">
            <h3 className="serif">Adesivo Personalizado</h3>
            <div>
              <label className="field-label">Tipo</label>
              <div className="swatch-row">
                {(['UV', 'Vinil'] as const).map(t => (
                  <button key={t} className={`swatch ${tipo === t ? 'on' : ''}`} onClick={() => setTipo(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Acabamento</label>
              <div className="swatch-row">
                {(['Recortado', 'Refilado', 'Laminado'] as const).map(a => (
                  <button key={a} className={`swatch ${acab === a ? 'on' : ''}`} onClick={() => setAcab(a)}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Formato</label>
              <div className="swatch-row">
                <button className={`swatch ${shape === 'circulo' ? 'on' : ''}`} onClick={() => setShape('circulo')}>⭕ Redondo</button>
                <button className={`swatch ${shape === 'quadrado' ? 'on' : ''}`} onClick={() => setShape('quadrado')}>◻️ Quadrado</button>
              </div>
            </div>
            <div>
              <label className="field-label">Tamanho</label>
              <div className="num-row">
                <input type="range" min={3} max={15} step={0.5} value={sizeCm} onChange={e => setSizeCm(parseFloat(e.target.value))} />
                <span className="mono" style={{ minWidth: 52, textAlign: 'right' }}>{sizeCm.toFixed(1).replace('.', ',')} cm</span>
              </div>
            </div>
            <div>
              <label className="field-label">Quantidade</label>
              <div className="swatch-row" style={{ marginBottom: 10 }}>
                {QTY_PRESETS.map(q => (
                  <button key={q} className={`swatch ${qty === q ? 'on' : ''}`} onClick={() => setQty(q)}>{q >= 1000 ? '1.000' : q} un</button>
                ))}
              </div>
              <div className="num-row">
                <input
                  type="number" min={1} step={1} value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: 110, height: 38, borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '0 12px', fontSize: 13.5, color: 'var(--ink-soft)', fontWeight: 700 }}
                />
                <span className="mono" style={{ fontSize: 12, color: 'var(--graphite-faint)' }}>quantidade exata (vale pra pedidos grandes também)</span>
              </div>
            </div>
            <ArteUpload arte={arte} onArteChange={setArte} />
            <div className="cfg-price-bar">
              <div className="amount mono">
                {percentual > 0 && <span className="old-price">R$ {calc.totalCheio.toFixed(2).replace('.', ',')}</span>}
                R$ {calc.total.toFixed(2).replace('.', ',')}<br /><small>no total{percentual > 0 ? ` (-${percentual}%)` : ''}</small>
              </div>
              <div className="meta"><span className="mono">{fmt(calc.precoM2)} / m²</span><br />Entrega em até 48h</div>
            </div>
            <div className="cfg-note">
              A bobina tem 1m de largura fixa — o comprimento cresce conforme o tamanho e a quantidade pedida. Preço = área da bobina usada (largura × comprimento) vezes o valor real por m² do Adesivo {tipo} {acab} no sistema.
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => { onAdd(`Adesivo ${tipo} ${acab} (${qty}un)`, calc.total, 1, undefined, arte ? { frente: arte } : undefined); setArte(null); }}>
              Adicionar ao pedido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
