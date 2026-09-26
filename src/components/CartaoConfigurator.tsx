import { useEffect, useMemo, useState, type RefObject } from 'react';
import { IMP_LABEL, type MultiProduct } from '../data';
import type { ErpLink } from '../context/CartContext';
import { usePromocao } from '../context/PromocaoContext';
import { ArteUpload, ArteGuides, ArteLegend, ehImagem, type Arte } from './ArtePreview';
import type { ArteAnexo } from '../types';

const QTY_OPTIONS = [100, 250, 500, 1000];
const IMPS = ['4x0', '4x1', '4x4'];

// Preço e id do ERP vêm do grupo "Cartão de Visita" montado em
// useProdutos.ts (itens "Cartão de Visita - 1000 uni C/verniz - 4x4"…).
const chave = (qty: number, imp: string, verniz: 'nao' | 'sim') =>
  ({ qtd: qty.toLocaleString('pt-BR'), imp, verniz: verniz === 'sim' ? 'Com' : 'Sem' });

export default function CartaoConfigurator({
  onAdd,
  sectionRef,
  grupo,
}: {
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: { frente?: ArteAnexo; verso?: ArteAnexo } | null, imagem?: string, erp?: ErpLink) => void;
  sectionRef?: RefObject<HTMLElement | null>;
  grupo?: MultiProduct;
}) {
  const [qty, setQty] = useState(1000);
  const [verniz, setVerniz] = useState<'nao' | 'sim'>('nao');
  const [imp, setImp] = useState('4x0');
  const [flipped, setFlipped] = useState(false);
  const [arteFrente, setArteFrente] = useState<Arte | null>(null);
  const [arteVerso, setArteVerso] = useState<Arte | null>(null);
  const { fator, percentual } = usePromocao();

  const qtyOptions = QTY_OPTIONS.filter(q => IMPS.some(i => grupo?.preco(chave(q, i, 'nao')) != null || grupo?.preco(chave(q, i, 'sim')) != null));
  const temVernizNaQtd = IMPS.some(i => grupo?.preco(chave(qty, i, 'sim')) != null);
  const opcoesImp = useMemo(
    () => IMPS.filter(i => grupo?.preco(chave(qty, i, verniz)) != null),
    [grupo, qty, verniz],
  );

  // Se a impressão escolhida não existir mais nessa combinação (ex: trocou
  // pra "com verniz" e não existe 4×1 com verniz), volta pra primeira válida.
  const impAtual = opcoesImp.includes(imp) ? imp : opcoesImp[0];
  const temVerso = impAtual !== '4x0';
  const versoPB = impAtual === '4x1';

  // Se voltar pra "só frente", não faz sentido manter uma arte de verso
  // esquecida (ela não seria usada mesmo).
  useEffect(() => {
    if (!temVerso) setArteVerso(null);
  }, [temVerso]);

  const totalCheio = grupo?.preco(chave(qty, impAtual, verniz)) ?? 0;
  const total = totalCheio * fator;

  function pickQty(q: number) {
    setQty(q);
    if (!IMPS.some(i => grupo?.preco(chave(q, i, 'sim')) != null)) setVerniz('nao');
  }

  // Sem o grupo no ERP (ou ainda carregando), a seção não aparece.
  if (!grupo || opcoesImp.length === 0) return null;

  const mostrarArteFrente = arteFrente && ehImagem(arteFrente);
  const mostrarArteVerso = arteVerso && ehImagem(arteVerso);

  return (
    <section id="cartoes" ref={sectionRef}>
      <div className="shell">
        <div className="section-head reveal in">
          <div className="kicker">Monte o seu</div>
          <h2 className="serif">Cartão de visita</h2>
          <p>Quantidade e impressão — toque no cartão ao lado pra ver o verso. Preço direto do sistema.</p>
        </div>
        <div className="configurator reveal in">
          <div className="cfg-preview">
            <div className="flip-stage">
              <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                <div className="flip-face front" style={mostrarArteFrente ? { padding: 0, overflow: 'hidden' } : undefined}>
                  {mostrarArteFrente ? (
                    <>
                      <img src={arteFrente.dataUrl} alt="Prévia da sua arte — frente" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      <ArteGuides formato="retangulo" larguraMm={90} alturaMm={50} />
                    </>
                  ) : (
                    <>
                      <div className="logo-dot" />
                      <div><b>Bella Arte</b><br /><span>GRÁFICA &amp; PERSONALIZADOS</span></div>
                    </>
                  )}
                </div>
                <div className="flip-face back" style={mostrarArteVerso ? { padding: 0, overflow: 'hidden' } : undefined}>
                  {mostrarArteVerso ? (
                    <>
                      <img
                        src={arteVerso.dataUrl} alt="Prévia da sua arte — verso"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: versoPB ? 'grayscale(1)' : undefined }}
                      />
                      <ArteGuides formato="retangulo" larguraMm={90} alturaMm={50} />
                    </>
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
            {(mostrarArteFrente || mostrarArteVerso) && <ArteLegend />}
            <div className="flip-hint">👆 toque no cartão pra virar</div>
          </div>
          <div className="cfg-fields">
            <h3 className="serif">Cartão Personalizado</h3>
            <div>
              <label className="field-label">Quantidade</label>
              <div className="swatch-row">
                {qtyOptions.map(q => (
                  <button key={q} className={`swatch ${qty === q ? 'on' : ''}`} onClick={() => pickQty(q)}>
                    {q >= 1000 ? '1.000' : q} un
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Impressão</label>
              <div className="swatch-row">
                {opcoesImp.map(op => (
                  <button key={op} className={`swatch ${impAtual === op ? 'on' : ''}`} onClick={() => setImp(op)}>
                    {IMP_LABEL[op]}
                  </button>
                ))}
              </div>
            </div>
            {temVernizNaQtd && (
              <div>
                <label className="field-label">Verniz</label>
                <div className="swatch-row">
                  <button className={`swatch ${verniz === 'nao' ? 'on' : ''}`} onClick={() => setVerniz('nao')}>Sem verniz</button>
                  <button className={`swatch ${verniz === 'sim' ? 'on' : ''}`} onClick={() => setVerniz('sim')}>Com verniz</button>
                </div>
              </div>
            )}
            <ArteUpload arte={arteFrente} onArteChange={setArteFrente} label={temVerso ? 'Sua arte — frente (opcional)' : 'Sua arte (opcional)'} />
            {temVerso && (
              <ArteUpload
                arte={arteVerso} onArteChange={setArteVerso} label="Sua arte — verso (opcional)"
                nota={versoPB ? 'Você escolheu impressão P&B — o verso sai em preto e branco, mesmo se a imagem enviada for colorida.' : undefined}
              />
            )}
            <div className="cfg-price-bar">
              <div className="amount mono">
                {percentual > 0 && <span className="old-price">R$ {totalCheio.toFixed(2).replace('.', ',')}</span>}
                R$ {total.toFixed(2).replace('.', ',')}<br /><small>no total{percentual > 0 ? ` (-${percentual}%)` : ''}</small>
              </div>
              <div className="meta">≈ R$ <span className="mono">{(total / qty).toFixed(2).replace('.', ',')}</span> / un</div>
            </div>
            <button
              className="btn-primary" style={{ width: '100%' }}
              onClick={() => {
                const vernizTxt = temVernizNaQtd ? (verniz === 'sim' ? 'com verniz, ' : 'sem verniz, ') : '';
                const arte = arteFrente || arteVerso ? { frente: arteFrente ?? undefined, verso: arteVerso ?? undefined } : undefined;
                onAdd(`Cartão de Visita ${qty}un, ${vernizTxt}${IMP_LABEL[impAtual]}`, total, 1, undefined, arte, undefined, { erpId: grupo.erpIdPorCombo?.(chave(qty, impAtual, verniz)) });
                setArteFrente(null);
                setArteVerso(null);
              }}
            >
              Adicionar ao pedido
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
