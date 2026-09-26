import { useEffect, useState } from 'react';
import { listOrders, type Order } from '../services/ordersService';
import { listCustomers } from '../auth/authService';
import { fmt } from '../data';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [clientesCount, setClientesCount] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([listOrders(), listCustomers()])
      .then(([o, c]) => { setOrders(o); setClientesCount(c.length); })
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar dados.'));
  }, []);

  if (erro) return <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center text-ink-muted">{erro}</div>;
  if (!orders || clientesCount === null) return <div className="rounded-2xl border border-cream-200 bg-white p-6 text-center text-ink-muted">Carregando…</div>;

  const receita = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <span className="text-2xl">📦</span>
          <p className="mt-2 font-display text-2xl font-extrabold text-ink">{orders.length}</p>
          <p className="text-sm text-ink-muted">pedidos</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <span className="text-2xl">💰</span>
          <p className="mt-2 font-display text-2xl font-extrabold text-ink">{fmt(receita)}</p>
          <p className="text-sm text-ink-muted">em pedidos</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <span className="text-2xl">👥</span>
          <p className="mt-2 font-display text-2xl font-extrabold text-ink">{clientesCount}</p>
          <p className="text-sm text-ink-muted">clientes cadastrados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Últimos pedidos</h2>
        <p className="mt-1 text-sm text-ink-muted">Pedidos feitos na loja, salvos no banco de dados — aparecem aqui não importa de onde você acessa.</p>
        {orders.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-muted">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-cream-200">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="p-3">Cliente</th><th className="p-3">Itens</th><th className="p-3">Total</th><th className="p-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="border-b border-cream-100 last:border-0">
                    <td className="p-3"><b className="text-ink">{o.nome}</b><br /><span className="text-ink-muted">{o.telefone}</span></td>
                    <td className="p-3">{o.itens.length} item{o.itens.length !== 1 ? 's' : ''}</td>
                    <td className="p-3 font-semibold text-ink">{fmt(o.total)}</td>
                    <td className="p-3 text-ink-muted">{new Date(o.criado_em).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
