import type { CartItem } from '../types';
import { fmt } from '../data';

export default function CartModal({
  open, cart, onClose, onRemove, onCheckout,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
  onRemove: (idx: number) => void;
  onCheckout: () => void;
}) {
  const total = cart.reduce((s, x) => s + x.preco * x.quantidade, 0);
  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
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
                </div>
                <div className="price-col">
                  <b>{fmt(item.preco * item.quantidade)}</b>
                  <button className="cart-remove" title="Remover" onClick={() => onRemove(i)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="cart-total-row"><span>Total</span><b>{fmt(total)}</b></div>
        <div className="modal-actions">
          <button className="btn-outline-full btn-flex" onClick={onClose}>Continuar vendo produtos</button>
          <button className="btn-primary btn-flex" onClick={onCheckout}>Finalizar pedido</button>
        </div>
      </div>
    </div>
  );
}
