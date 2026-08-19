import { useMemo, useState, type RefObject } from 'react';
import { CARTAO_PRECOS, IMP_LABEL } from '../data';
import { usePromocao } from '../context/PromocaoContext';
import ArtePreview, { type Arte } from './ArtePreview';

const QTY_OPTIONS = [100, 250, 500, 1000];

export default function CartaoConfigurator({
  onAdd,
  sectionRef,
}: {
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: Arte | null) => void;
  sectionRef?: RefObject<HTMLElement | null>;
}) {
  const [qty, setQty] = useState(1000);
  const [verniz, setVerniz] = useState<'nao' | 'sim'>('nao');
  const [imp, setImp] = useState('4x0');
  const [flipped, setFlipped] = useState(false);
  const [arte, setArte] = useState<Arte | null>(null);
  const { fator, percentual } = usePromocao();

  const opcoesImp = useMemo(() => {
    const tabela = qty === 1000 && verniz === 'sim' ? CARTAO_PRECOS[1000].comVerniz! : CARTAO_PRECOS[qty].semVerniz;
    return Object.keys(tabela);
  }, [qty, verniz]);

  // Se a impressão escolhida não existir mais nessa combinação (ex: trocou
  // pra "com verniz" e não existe 4×1 com verniz), volta pra primeira válida.
  const impAtual = opcoesImp.includes(imp) ? imp : opcoesImp[0];

  const totalCheio = useMemo(() => {
    const tabela = qty === 1000 && verniz === 'sim' ? CARTAO_PRECOS[1000].comVerniz! : CARTAO_PRECOS[qty].semVerniz;
    return tabela[impAtual];
  }, [qty, verniz, impAtual]);
  const total = totalCheio * fator;

  function pickQty(q: number) {
    setQty(q);
    if (q !== 1000) setVerniz('nao');
  }

  return (
    <section id="cartoes" ref={sectionRef}>
      <div className="shell">
        <div className="section-head reveal in">
          <div className="kicker">Monte o seu</div>
          <h2 className="serif">Cartão de visita</h2>
          <p>Quantidade e impressão — toque no cartão ao lado pra ver o verso. Preço direto da tabela real do sistema.</p>
        </div>
        <div className="configurator reveal in">
          <div className="cfg-preview">
            <div className="flip-stage">
              <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                <div className="flip-face front">
                  <div className="logo-dot" />
                  <div><b>Bella Arte</b><br /><span>GRÁFICA &amp; PERSONALIZADOS</span></div>
                </div>
                <div className="flip-face back">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                    <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flip-hint">👆 toque no cartão pra virar</div>
          </div>
          <div className="cfg-fields">
            <h3 className="serif">Cartão Personalizado</h3>
            <div>
              <label className="field-label">Quantidade</label>
              <div className="swatch-row">
                {QTY_OPTIONS.map(q => (
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
            {qty === 1000 && (
              <div>
                <label className="field-label">Verniz (só disponível em 1.000 un)</label>
                <div className="swatch-row">
                  <button className={`swatch ${verniz === 'nao' ? 'on' : ''}`} onClick={() => setVerniz('nao')}>Sem verniz</button>
                  <button className={`swatch ${verniz === 'sim' ? 'on' : ''}`} onClick={() => setVerniz('sim')}>Com verniz</button>
                </div>
              </div>
            )}
            <ArtePreview formato="retangulo" larguraMm={90} alturaMm={50} arte={arte} onArteChange={setArte} />
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
                const vernizTxt = qty === 1000 ? (verniz === 'sim' ? 'com verniz, ' : 'sem verniz, ') : '';
                onAdd(`Cartão de Visita ${qty}un, ${vernizTxt}${IMP_LABEL[impAtual]}`, total, 1, undefined, arte);
                setArte(null);
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
