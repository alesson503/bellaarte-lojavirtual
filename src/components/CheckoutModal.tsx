import { useState } from 'react';
import type { CartItem } from '../App';
import { fmt } from '../data';

export default function CheckoutModal({
  open, cart, onClose,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
}) {
  const [nome, setNome] = useState('');
  const [phone, setPhone] = useState('');
  const [delivery, setDelivery] = useState('Retirar na Bella Arte');
  const [status, setStatus] = useState<'idle' | 'erro' | 'ok'>('idle');

  const total = cart.reduce((s, x) => s + x.preco, 0);

  function submit() {
    if (!nome.trim() || !phone.trim()) { setStatus('erro'); return; }
    setStatus('ok');
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="serif">Finalizar pedido</h2>
        <p className="modal-sub">Prévia — simula os dados que seriam enviados pro sistema da Bella Arte.</p>
        <div className="field-group"><label>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
        <div className="field-group"><label>WhatsApp</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 90000-0000" /></div>
        <div className="field-group">
          <label>Entrega</label>
          <select value={delivery} onChange={e => setDelivery(e.target.value)}>
            <option>Retirar na Bella Arte</option>
            <option>Entrega (combinar endereço)</option>
            <option>Combinar pelo WhatsApp</option>
          </select>
        </div>
        <div className="checkout-summary">
          {cart.map((x, i) => (
            <div className="checkout-summary-row" key={i}><span>{x.nome}</span><span>{fmt(x.preco)}</span></div>
          ))}
          <div className="checkout-summary-row" style={{ fontWeight: 800, color: 'var(--violet-deep)', borderTop: '1px dashed var(--blush-line)', marginTop: 6, paddingTop: 8 }}>
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={submit}>Enviar pedido para a Bella Arte</button>
        {status === 'erro' && <p style={{ color: 'var(--blush-deep)', fontSize: 12.5, marginTop: 10 }}>Preenche pelo menos nome e WhatsApp pra continuar.</p>}
        {status === 'ok' && (
          <div className="checkout-ok">
            ✓ Pedido de demonstração preparado pra <b>{nome}</b> ({delivery}). Quando a loja for integrada de verdade, isso vira um pedido real no seu sistema (igual um da tela de Vendas).
          </div>
        )}
      </div>
    </div>
  );
}
