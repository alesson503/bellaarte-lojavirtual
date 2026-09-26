import { useMemo, useState, type RefObject } from 'react';
import { fmt, type MultiProduct } from '../data';
import type { ErpLink } from '../context/CartContext';
import { usePromocao } from '../context/PromocaoContext';
import { ArteUpload, ArteGuides, ArteLegend, ehImagem, type Arte } from './ArtePreview';
import type { ArteAnexo } from '../types';

type Tipo = 'UV' | 'Vinil';
type Acabamento = 'Recortado' | 'Refilado' | 'Laminado';

export default function AdesivoConfigurator({
  onAdd,
  sectionRef,
  grupos,
}: {
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: { frente?: ArteAnexo; verso?: ArteAnexo } | null, imagem?: string, erp?: ErpLink) => void;
  sectionRef?: RefObject<HTMLElement | null>;
  // Grupos "Adesivo UV" / "Adesivo Vinil" montados em useProdutos.ts a
  // partir do ERP — preço por m² e id do ERP de cada acabamento vêm dali.
  grupos: Partial<Record<Tipo, MultiProduct>>;
}) {
  const [tipo, setTipo] = useState<Tipo>('UV');
  const [acab, setAcab] = useState<Acabamento>('Recortado');
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);
  const [arte, setArte] = useState<Arte | null>(null);
  const { fator, percentual } = usePromocao();
  const tiposDisponiveis = (['UV', 'Vinil'] as const).filter(t => grupos[t]);
  const tipoAtual: Tipo = grupos[tipo] ? tipo : tiposDisponiveis[0] ?? 'UV';
  const acabsDisponiveis = (['Recortado', 'Refilado', 'Laminado'] as const).filter(a => grupos[tipoAtual]?.preco({ acab: a }) != null);
  const acabAtual: Acabamento = acabsDisponiveis.includes(acab) ? acab : acabsDisponiveis[0] ?? 'Recortado';

  // Preço direto por Largura × Altura (m²) — igual Banner/Lona, em vez do
  // cálculo antigo de encaixe na bobina (formato + tamanho em cm).
  const calc = useMemo(() => {
    const larguraM = Math.max(0.1, larg);
    const alturaM = Math.max(0.1, alt);
    const m2 = larguraM * alturaM;
    const precoM2 = grupos[tipoAtual]?.preco({ acab: acabAtual }) ?? 0;
    const totalCheio = m2 * precoM2;
    const total = totalCheio * fator;
    return { larguraM, alturaM, m2, precoM2, totalCheio, total };
  }, [larg, alt, tipoAtual, acabAtual, grupos, fator]);

  // Proporção da prévia — não deixa ficar fininha/esticada demais quando a
  // medida real é bem desproporcional (ex.: 3m × 0,2m).
  const previewAspect = Math.min(3, Math.max(1 / 3, calc.larguraM / calc.alturaM));

  // Sem os produtos de Adesivo no ERP (ou ainda carregando), a seção não aparece.
  if (tiposDisponiveis.length === 0) return null;

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
                {tiposDisponiveis.map(t => (
                  <button key={t} className={`swatch ${tipoAtual === t ? 'on' : ''}`} onClick={() => setTipo(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Acabamento</label>
              <div className="swatch-row">
                {acabsDisponiveis.map(a => (
                  <button key={a} className={`swatch ${acabAtual === a ? 'on' : ''}`} onClick={() => setAcab(a)}>{a}</button>
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
              Preço = largura × altura (m²) vezes o valor real por m² do Adesivo {tipoAtual} {acabAtual} no sistema.
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => { onAdd(`Adesivo ${tipoAtual} ${acabAtual} (${calc.larguraM.toFixed(2).replace('.', ',')}m × ${calc.alturaM.toFixed(2).replace('.', ',')}m)`, calc.total, 1, undefined, arte ? { frente: arte } : undefined, undefined, { erpId: grupos[tipoAtual]?.erpIdPorCombo?.({ acab: acabAtual }), m2: calc.m2 }); setArte(null); }}>
              Adicionar ao pedido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
