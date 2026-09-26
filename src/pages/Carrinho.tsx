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
// pedido de verdade na API. Visual: `carrinho-drawer.tsx` do protótipo
// `loja-virtual` (card por item, com foto do produto).
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
    <div className="flex min-h-screen flex-col">
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => {}} />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-0 pt-10">
        <h1 className="font-display text-2xl font-extrabold text-ink">Meu carrinho 🛒</h1>
        <p className="mt-1 text-sm text-ink-muted">Itens que você foi adicionando.</p>

        {cart.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-cream-200 bg-white p-10 text-center text-ink-muted">
            <span className="text-4xl">🛍️</span>
            <p>Seu carrinho está vazio.<br />Escolha um produto pra começar.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-rose-50">
                  {item.imagem ? (
                    <img src={item.imagem} alt={item.nome} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎁</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.nome}{item.quantidade > 1 ? ` × ${item.quantidade}` : ''}</p>
                  {item.observacao && <p className="mt-0.5 text-xs text-ink-muted">obs: {item.observacao}</p>}
                  {item.arte?.frente && <p className="mt-0.5 text-xs text-ink-muted">📎 arte (frente): {item.arte.frente.nome}</p>}
                  {item.arte?.verso && <p className="mt-0.5 text-xs text-ink-muted">📎 arte (verso): {item.arte.verso.nome}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-display font-bold text-rose">{fmt(item.preco * item.quantidade)}</span>
                  <button onClick={() => removeFromCart(i)} className="text-lg text-ink-muted hover:text-rose" title="Remover" aria-label="Remover">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-cream-200 pt-5">
          <span className="text-ink-muted">Total</span>
          <span className="font-display text-2xl font-extrabold text-ink">{fmt(total)}</span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={() => navigate('/produtos')} className="rounded-2xl border border-cream-200 px-6 py-3.5 font-bold text-ink transition hover:border-rose hover:text-rose">
            Continuar vendo produtos
          </button>
          <button onClick={finalizarPedido} className="rounded-2xl bg-rose px-6 py-3.5 font-bold text-white transition hover:brightness-95">
            Finalizar pedido
          </button>
        </div>
      </div>
      <Footer />
      <CheckoutModal open={checkoutOpen} cart={cart} onClose={() => setCheckoutOpen(false)} />
    </div>
  );
}
