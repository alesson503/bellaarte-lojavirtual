import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fmt } from '../data';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CheckoutModal from '../components/CheckoutModal';

// Página de verdade pro que era CartModal.tsx. O checkout continua sendo
// um modal (CheckoutModal), aberto a partir daqui — ele quem cria o
// pedido de verdade na API.
export default function Carrinho() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, removeFromCart } = useCart();
  const { toast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // "Comprar agora" na página de produto já pede pra abrir o checkout
  // direto ao chegar aqui.
  useEffect(() => {
    const state = location.state as { openCheckout?: boolean } | null;
    if (state?.openCheckout) {
      setCheckoutOpen(true);
      navigate('.', { replace: true, state: null });
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = cart.reduce((s, x) => s + x.preco * x.quantidade, 0);

  function finalizarPedido() {
    if (!cart.length) { toast('Seu carrinho está vazio — adicione um produto primeiro.'); return; }
    setCheckoutOpen(true);
  }

  return (
    <>
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => {}} />
      <div className="shell" style={{ paddingTop: 40, paddingBottom: 68, maxWidth: 640 }}>
        <h2 className="serif">Meu carrinho</h2>
        <p className="modal-sub">Itens que você foi adicionando.</p>
        <div>
          {cart.length === 0 ? (
            <div className="cart-empty">Seu carrinho está vazio.<br />Escolha um produto pra começar.</div>
          ) : (
            cart.map((item, i) => (
              <div className="cart-row" key={i}>
                <div className="info">
                  <b>{item.nome}{item.quantidade > 1 ? ` × ${item.quantidade}` : ''}</b>
                  {item.observacao && <div>obs: {item.observacao}</div>}
                  {item.arte?.frente && <div>📎 arte (frente): {item.arte.frente.nome}</div>}
                  {item.arte?.verso && <div>📎 arte (verso): {item.arte.verso.nome}</div>}
                </div>
                <div className="price-col">
                  <b>{fmt(item.preco * item.quantidade)}</b>
                  <button className="cart-remove" title="Remover" onClick={() => removeFromCart(i)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-total-row"><span>Total</span><b>{fmt(total)}</b></div>
        <div className="modal-actions">
          <button className="btn-outline-full btn-flex" onClick={() => navigate('/produtos')}>Continuar vendo produtos</button>
          <button className="btn-primary btn-flex" onClick={finalizarPedido}>Finalizar pedido</button>
        </div>
      </div>
      <Footer />
      <CheckoutModal open={checkoutOpen} cart={cart} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
