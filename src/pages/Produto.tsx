import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fmt, type Produto as ProdutoType } from '../data';
import { useProdutos } from '../hooks/useProdutos';
import { useCart } from '../context/CartContext';
import { useWhatsapp } from '../context/WhatsappContext';
import { usePromocao } from '../context/PromocaoContext';
import { CategoryIcon, WhatsAppIcon } from '../icons';
import { whatsappLink } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Página de verdade pro que era o card de produto expandido. Cobre os três
// tipos que têm uma "ficha" própria — simples, multi (opções fixas tipo
// quantidade/cor) e medida (largura×altura livre). `link` (Adesivo UV/Vinil,
// Cartão de Visita) não passa por aqui — esses vão direto pro configurador.
export default function Produto() {
  const { id = '' } = useParams();
  const nome = decodeURIComponent(id);
  const navigate = useNavigate();
  const { catalogo } = useProdutos();
  const { addToCart } = useCart();
  const whatsapp = useWhatsapp();
  const { fator, percentual } = usePromocao();

  const encontrado = catalogo.find(p => p.nome === nome && p.tipo !== 'link') ?? null;
  const produto = encontrado as Exclude<ProdutoType, { tipo: 'link' }> | null;

  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [selMulti, setSelMulti] = useState<Record<string, string>>({});
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);

  // Reseta a seleção sempre que o produto (parâmetro da rota) muda.
  useEffect(() => {
    setCorSelecionada(produto?.tipo === 'simples' ? produto.cores?.[0]?.nome ?? null : null);
    setQuantidade(1);
    setObservacao('');
    setSelMulti(produto?.tipo === 'multi' ? Object.fromEntries(produto.dims.map(d => [d.key, d.options[0]])) : {});
    setLarg(1);
    setAlt(1);
    window.scrollTo(0, 0);
  }, [nome]);

  if (!produto) {
    return (
      <>
        <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
        <div className="shell" style={{ padding: '68px 0', textAlign: 'center' }}>
          <p>Produto não encontrado.</p>
          <button className="btn-ghost" onClick={() => navigate('/produtos')}>← Voltar pro catálogo</button>
        </div>
        <Footer />
      </>
    );
  }

  function irParaCategoria() {
    navigate(`/produtos?categoria=${encodeURIComponent(produto!.categoria)}`);
  }

  // ── preço + nome-pro-pedido, um por tipo ──
  const corObj = produto.tipo === 'simples' ? produto.cores?.find(c => c.nome === corSelecionada) ?? null : null;
  const fotoExibida = corObj?.foto || (produto.tipo === 'simples' ? produto.imagem : undefined);

  const m2 = Math.max(0.1, larg) * Math.max(0.1, alt);
  const precoMultiCheio = produto.tipo === 'multi' ? produto.preco(selMulti) : null;
  const precoMedidaCheio = produto.tipo === 'medida' ? m2 * produto.precoM2 : null;

  const preco =
    produto.tipo === 'simples' ? produto.preco :
    produto.tipo === 'multi' ? (precoMultiCheio != null ? precoMultiCheio * fator : null) :
    precoMedidaCheio! * fator;

  const nomeParaPedido =
    produto.tipo === 'simples' ? (produto.cores?.length && corSelecionada ? `${produto.nome} (${corSelecionada})` : produto.nome) :
    produto.tipo === 'multi' ? `${produto.nome} (${produto.dims.map(d => selMulti[d.key]).join(' · ')})` :
    `${produto.nome} (${larg.toFixed(2).replace('.', ',')}m × ${alt.toFixed(2).replace('.', ',')}m = ${m2.toFixed(2).replace('.', ',')}m²)`;

  const qtdPedido = produto.tipo === 'simples' ? quantidade : 1;
  const podeAdicionar = preco != null;
  const mensagemWhats = podeAdicionar
    ? `Olá! Quero pedir: ${nomeParaPedido}${qtdPedido > 1 ? ` — ${qtdPedido} un` : ''} — ${fmt(preco! * qtdPedido)}${observacao ? `\nObs: ${observacao}` : ''}`
    : `Olá! Quero pedir: ${nomeParaPedido}`;

  function adicionar() {
    if (preco == null) return;
    addToCart(nomeParaPedido, preco, qtdPedido, produto!.tipo === 'simples' ? observacao : undefined);
    navigate('/produtos');
  }

  function comprarAgora() {
    if (preco == null) return;
    addToCart(nomeParaPedido, preco, qtdPedido, produto!.tipo === 'simples' ? observacao : undefined);
    navigate('/carrinho', { state: { openCheckout: true } });
  }

  return (
    <>
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="shell" style={{ paddingTop: 4 }}>
        <div className="crumbs">
          <span className="link" onClick={() => navigate('/')}>Início</span> / <span className="link" onClick={irParaCategoria}>{produto.categoria}</span> / <span className="now">{produto.nome}</span>
        </div>
        <div className="pd-layout">
          <div className="detail-thumb" data-cat={produto.categoria}>
            <span className="cat-tag">{produto.categoria}</span>
            {produto.tipo === 'simples' && produto.descontoPercentual ? <span className="badge-multi">-{produto.descontoPercentual}%</span> : null}
            {produto.tipo !== 'simples' && percentual > 0 ? <span className="badge-multi">-{percentual}%</span> : null}
            {fotoExibida ? (
              <img src={fotoExibida} alt={corObj ? `${produto.nome} — ${corObj.nome}` : produto.nome} className="prod-thumb-img" />
            ) : (
              <CategoryIcon categoria={produto.categoria} />
            )}
          </div>

          <div>
            <div className="pd-cat">{produto.categoria}</div>
            <h1 className="serif" style={{ fontSize: 26, marginBottom: 6 }}>{produto.nome}</h1>
            {produto.tipo === 'simples' && produto.descricao && (
              <p className="modal-sub" style={{ marginBottom: produto.especificacoes?.length ? 8 : 16 }}>{produto.descricao}</p>
            )}

            {produto.tipo === 'simples' && produto.especificacoes?.length ? (
              <ul className="detail-specs">
                {produto.especificacoes.map((e, i) => (
                  <li key={i}><b>{e.chave}:</b> {e.valor}</li>
                ))}
              </ul>
            ) : null}

            {produto.tipo === 'simples' && produto.cores?.length ? (
              <div className="field-group">
                <label>Cor</label>
                <div className="swatch-row">
                  {produto.cores.map(cor => (
                    <button
                      key={cor.nome}
                      className={`swatch ${corSelecionada === cor.nome ? 'on' : ''}`}
                      onClick={() => setCorSelecionada(cor.nome)}
                    >
                      {cor.foto && <img src={cor.foto} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover' }} />}
                      {cor.nome}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {produto.tipo === 'simples' && (
              <div className="field-group">
                <label>Quantidade</label>
                <div className="qty-stepper">
                  <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
                  <span>{quantidade}</span>
                  <button type="button" onClick={() => setQuantidade(q => q + 1)}>+</button>
                </div>
              </div>
            )}

            {produto.tipo === 'multi' && produto.dims.map(d => (
              <div className="field-group" key={d.key}>
                <label>{d.label}</label>
                <div className="swatch-row">
                  {d.options.map(op => (
                    <button
                      key={op}
                      className={`swatch ${selMulti[d.key] === op ? 'on' : ''}`}
                      onClick={() => setSelMulti(prev => ({ ...prev, [d.key]: op }))}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {produto.tipo === 'medida' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label>Largura (m)</label>
                  <input
                    type="number" min={0.1} step={0.1} value={larg}
                    onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label>Altura (m)</label>
                  <input
                    type="number" min={0.1} step={0.1} value={alt}
                    onChange={e => setAlt(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  />
                </div>
              </div>
            )}
            {produto.tipo === 'medida' && (
              <div style={{ fontSize: 11.5, color: 'var(--graphite-faint)', margin: '-8px 0 16px' }}>
                {m2.toFixed(2).replace('.', ',')} m² · {fmt(produto.precoM2)}/m²
              </div>
            )}

            {produto.tipo === 'simples' && (
              <div className="field-group">
                <label>Observação (opcional)</label>
                <textarea
                  rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
                  placeholder="Ex.: essa unidade é com a foto da Maria — se pedir mais de uma arte diferente, adicione cada uma separada com sua observação"
                />
              </div>
            )}

            <div className="price-row" style={{ marginTop: 4 }}>
              <div>
                {produto.tipo === 'simples' && quantidade > 1 && <div className="from">{fmt(produto.preco)} cada</div>}
                {preco == null ? (
                  <div className="p" style={{ fontSize: 24 }}>combinação indisponível</div>
                ) : (
                  <div className="p" style={{ fontSize: 24 }}>
                    {produto.tipo === 'simples' && produto.precoOriginal != null && produto.precoOriginal > produto.preco && (
                      <span className="old-price">{fmt(produto.precoOriginal * quantidade)}</span>
                    )}
                    {produto.tipo === 'multi' && percentual > 0 && precoMultiCheio != null && (
                      <span className="old-price">{fmt(precoMultiCheio)}</span>
                    )}
                    {produto.tipo === 'medida' && percentual > 0 && (
                      <span className="old-price">{fmt(precoMedidaCheio!)}</span>
                    )}
                    {fmt(preco * qtdPedido)}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="add-btn btn-flex" disabled={!podeAdicionar} onClick={adicionar}>Adicionar ao pedido</button>
              <button className="buy-now-btn btn-flex" disabled={!podeAdicionar} onClick={comprarAgora}>⚡ Comprar agora</button>
            </div>
            <div className="modal-actions" style={{ marginTop: 10 }}>
              <a
                className="btn-outline-full btn-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                href={whatsappLink(whatsapp, mensagemWhats)}
                target="_blank" rel="noopener noreferrer"
              >
                <WhatsAppIcon /> Comprar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
