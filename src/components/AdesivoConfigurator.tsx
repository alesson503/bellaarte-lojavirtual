import { useEffect, useMemo, useState, type RefObject } from 'react';
import { ADESIVO_PRECOS as ADESIVO_PRECOS_FALLBACK, fmt } from '../data';
import { getAdesivoPrecos } from '../services/productsService';
import { usePromocao } from '../context/PromocaoContext';
import { ArteUpload, ArteGuides, ArteLegend, ehImagem, type Arte } from './ArtePreview';
import type { ArteAnexo } from '../types';

type Tipo = 'UV' | 'Vinil';
type Acabamento = 'Recortado' | 'Refilado' | 'Laminado';

export default function AdesivoConfigurator({
  onAdd,
  sectionRef,
}: {
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: { frente?: ArteAnexo; verso?: ArteAnexo } | null) => void;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  const [tipo, setTipo] = useState<Tipo>('UV');
  const [acab, setAcab] = useState<Acabamento>('Recortado');
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);
  const [arte, setArte] = useState<Arte | null>(null);
  const { fator, percentual } = usePromocao();
  // Preço real do sistema — se a busca falhar, usa a tabela fixa como reserva.
  const [precos, setPrecos] = useState(ADESIVO_PRECOS_FALLBACK);
  useEffect(() => {
    getAdesivoPrecos().then(setPrecos).catch(() => { /* mantém a tabela fixa (fallback) */ });
  }, []);

  // Preço direto por Largura × Altura (m²) — igual Banner/Lona, em vez do
  // cálculo antigo de encaixe na bobina (formato + tamanho em cm).
  const calc = useMemo(() => {
    const larguraM = Math.max(0.1, larg);
    const alturaM = Math.max(0.1, alt);
    const m2 = larguraM * alturaM;
    const precoM2 = precos[tipo][acab];
    const totalCheio = m2 * precoM2;
    const total = totalCheio * fator;
    return { larguraM, alturaM, m2, precoM2, totalCheio, total };
  }, [larg, alt, tipo, acab, precos, fator]);

  // Proporção da prévia — não deixa ficar fininha/esticada demais quando a
  // medida real é bem desproporcional (ex.: 3m × 0,2m).
  const previewAspect = Math.min(3, Math.max(1 / 3, calc.larguraM / calc.alturaM));

  return (
    <section id="adesivos" className="band" ref={sectionRef}>
      <div className="shell">
        <div className="section-head reveal in">
          <div className="kicker">Monte o seu</div>
          <h2 className="serif">Adesivos, do seu jeito</h2>
          <p>Escolha o tipo, o acabamento e a medida (largura × altura) — a gente calcula o preço na hora, usando o valor real por m² do sistema.</p>
        </div>
        <div className="configurator reveal in">
          <div className="cfg-preview">
            <div className="art-box" style={{ width: 'min(320px, 100%)', aspectRatio: previewAspect }}>
              {arte && ehImagem(arte) ? (
                <img src={arte.dataUrl} alt="Prévia da sua arte" />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--graphite)' }}>
                  {calc.larguraM.toFixed(2).replace('.', ',')}m × {calc.alturaM.toFixed(2).replace('.', ',')}m
                </div>
              )}
              <ArteGuides formato="retangulo" larguraMm={calc.larguraM * 1000} alturaMm={calc.alturaM * 1000} />
            </div>
            <ArteLegend />
            <div className="sheet-fit-note">
              <b>{calc.m2.toFixed(2).replace('.', ',')}</b> m² no total
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
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">Largura (m)</label>
                <input
                  type="number" min={0.1} step={0.1} value={larg}
                  onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  style={{ width: '100%', height: 38, borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '0 12px', fontSize: 13.5, color: 'var(--ink-soft)', fontWeight: 700 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">Altura (m)</label>
                <input
                  type="number" min={0.1} step={0.1} value={alt}
                  onChange={e => setAlt(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  style={{ width: '100%', height: 38, borderRadius: 9, border: '1.5px solid var(--line)', background: 'var(--paper)', padding: '0 12px', fontSize: 13.5, color: 'var(--ink-soft)', fontWeight: 700 }}
                />
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
              Preço = largura × altura (m²) vezes o valor real por m² do Adesivo {tipo} {acab} no sistema.
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => { onAdd(`Adesivo ${tipo} ${acab} (${calc.larguraM.toFixed(2).replace('.', ',')}m × ${calc.alturaM.toFixed(2).replace('.', ',')}m)`, calc.total, 1, undefined, arte ? { frente: arte } : undefined); setArte(null); }}>
              Adicionar ao pedido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
