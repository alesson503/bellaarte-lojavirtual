import { useEffect, useState } from 'react';
import type { CartItem } from '../types';
import { fmt } from '../data';
import { useAuth } from '../auth/AuthContext';
import { createOrder } from '../services/ordersService';

export default function CheckoutModal({
  open, cart, onClose,
}: {
  open: boolean;
  cart: CartItem[];
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [phone, setPhone] = useState('');
  const [delivery, setDelivery] = useState('Retirar na Bella Arte');
  const [status, setStatus] = useState<'idle' | 'erro' | 'ok'>('idle');
  const [erroMsg, setErroMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open && user) setNome(prev => prev || user.nome);
  }, [open, user]);

  const total = cart.reduce((s, x) => s + x.preco, 0);

  async function submit() {
    if (!nome.trim() || !phone.trim()) { setStatus('erro'); setErroMsg('Preenche pelo menos nome e WhatsApp pra continuar.'); return; }
    setEnviando(true);
    try {
      await createOrder({ clienteId: user?.id ?? null, nome: nome.trim(), telefone: phone.trim(), entrega: delivery, itens: cart, total });
      setStatus('ok');
    } catch (e) {
      setStatus('erro');
      setErroMsg(e instanceof Error ? e.message : 'Não foi possível enviar o pedido. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="serif">Finalizar pedido</h2>
        <p className="modal-sub">Confirme seus dados pra gente preparar seu pedido.</p>
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
        <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar pedido para a Bella Arte'}
        </button>
        {status === 'erro' && <p style={{ color: 'var(--blush-deep)', fontSize: 12.5, marginTop: 10 }}>{erroMsg}</p>}
        {status === 'ok' && (
          <div className="checkout-ok">
            ✓ Pedido registrado pra <b>{nome}</b> ({delivery}) — já aparece no painel /admin. A gente entra em contato pelo WhatsApp pra confirmar os detalhes.
          </div>
        )}
      </div>
    </div>
  );
}
