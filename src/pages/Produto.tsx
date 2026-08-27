import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fmt } from '../data';
import { useProdutos } from '../hooks/useProdutos';
import { useCart } from '../context/CartContext';
import { useWhatsapp } from '../context/WhatsappContext';
import { CategoryIcon, WhatsAppIcon } from '../icons';
import { whatsappLink } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Página de verdade pro que era ProductDetailModal.tsx — só cobre produtos
// `simples` (os `multi`/`medida`/`link` continuam como cards inline na
// vitrine, igual já era antes).
export default function Produto() {
  const { id = '' } = useParams();
  const nome = decodeURIComponent(id);
  const navigate = useNavigate();
  const { simples } = useProdutos();
  const { addToCart } = useCart();
  const whatsapp = useWhatsapp();

  const produto = simples.find(p => p.nome === nome) ?? null;

  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  // Reseta a seleção sempre que o produto (parâmetro da rota) muda.
  useEffect(() => {
    setCorSelecionada(produto?.cores?.[0]?.nome ?? null);
    setQuantidade(1);
    setObservacao('');
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

  const corObj = produto.cores?.find(c => c.nome === corSelecionada) ?? null;
  const fotoExibida = corObj?.foto || produto.imagem;
  const nomeComCor = produto.cores?.length && corSelecionada ? `${produto.nome} (${corSelecionada})` : produto.nome;
  const mensagemWhats = `Olá! Quero pedir: ${nomeComCor}${quantidade > 1 ? ` — ${quantidade} un` : ''} — ${fmt(produto.preco * quantidade)}${observacao ? `\nObs: ${observacao}` : ''}`;

  function adicionar() {
    addToCart(nomeComCor, produto!.preco, quantidade, observacao);
    navigate('/produtos');
  }

  function comprarAgora() {
    addToCart(nomeComCor, produto!.preco, quantidade, observacao);
    navigate('/carrinho', { state: { openCheckout: true } });
  }

  return (
    <>
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="shell" style={{ paddingTop: 40, paddingBottom: 68, maxWidth: 640 }}>
        <button className="btn-ghost" style={{ marginBottom: 20 }} onClick={() => navigate('/produtos')}>← Voltar pro catálogo</button>

        <div className="detail-thumb" data-cat={produto.categoria}>
          <span className="cat-tag">{produto.categoria}</span>
          {produto.descontoPercentual ? <span className="badge-multi">-{produto.descontoPercentual}%</span> : null}
          {fotoExibida ? (
            <img src={fotoExibida} alt={corObj ? `${produto.nome} — ${corObj.nome}` : produto.nome} className="prod-thumb-img" />
          ) : (
            <CategoryIcon categoria={produto.categoria} />
          )}
        </div>

        <h2 className="serif">{produto.nome}</h2>
        {produto.descricao && <p className="modal-sub" style={{ marginBottom: produto.especificacoes?.length ? 8 : 16 }}>{produto.descricao}</p>}

        {produto.especificacoes?.length ? (
          <ul className="detail-specs">
            {produto.especificacoes.map((e, i) => (
              <li key={i}><b>{e.chave}:</b> {e.valor}</li>
            ))}
          </ul>
        ) : null}

        {produto.cores?.length ? (
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

        <div className="field-group">
          <label>Quantidade</label>
          <div className="qty-stepper">
            <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
            <span>{quantidade}</span>
            <button type="button" onClick={() => setQuantidade(q => q + 1)}>+</button>
          </div>
        </div>

        <div className="field-group">
          <label>Observação (opcional)</label>
          <textarea
            rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
            placeholder="Ex.: essa unidade é com a foto da Maria — se pedir mais de uma arte diferente, adicione cada uma separada com sua observação"
          />
        </div>

        <div className="price-row" style={{ marginTop: 4 }}>
          <div>
            {quantidade > 1 && <div className="from">{fmt(produto.preco)} cada</div>}
            <div className="p" style={{ fontSize: 24 }}>
              {produto.precoOriginal != null && produto.precoOriginal > produto.preco && (
                <span className="old-price">{fmt(produto.precoOriginal * quantidade)}</span>
              )}
              {fmt(produto.preco * quantidade)}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="add-btn btn-flex" onClick={adicionar}>Adicionar ao pedido</button>
          <button className="buy-now-btn btn-flex" onClick={comprarAgora}>⚡ Comprar agora</button>
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
      <Footer />
    </>
  );
}
