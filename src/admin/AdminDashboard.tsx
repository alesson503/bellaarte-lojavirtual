import { useEffect, useState } from 'react';
import { listOrders, type Order } from '../services/ordersService';
import { listCustomers } from '../auth/authService';
import { listarErros, type ErroFrontend } from '../services/errosService';
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

      <ErrosRecentesPanel />
    </>
  );
}

// Técnico, discreto — só aparece quando existe algo pra mostrar. Alimentado
// sozinho pela tela de erro (ErrorBoundary) toda vez que alguma página trava.
function ErrosRecentesPanel() {
  const [erros, setErros] = useState<ErroFrontend[] | null>(null);
  const [aberto, setAberto] = useState<number | null>(null);

  useEffect(() => { listarErros().then(setErros).catch(() => setErros([])); }, []);

  if (!erros || erros.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Erros recentes do site (técnico)</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Toda vez que uma página trava e aparece a tela de "Ops, algo deu errado", fica registrado aqui sozinho.
        Se acontecer de novo, clica num item e manda print pro suporte.
      </p>
      <div className="mt-4 divide-y divide-cream-100">
        {erros.map(e => (
          <div key={e.id} className="py-3">
            <button onClick={() => setAberto(a => (a === e.id ? null : e.id))} className="flex w-full items-start justify-between gap-3 text-left">
              <div>
                <p className="text-sm font-semibold text-ink">{e.mensagem.split('\n')[0]}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{new Date(e.criado_em).toLocaleString('pt-BR')} — {e.url}</p>
              </div>
              <span className="shrink-0 text-ink-muted">{aberto === e.id ? '▲' : '▼'}</span>
            </button>
            {aberto === e.id && (
              <pre className="mt-2 overflow-x-auto rounded-xl bg-cream-100 p-3 text-xs text-ink-soft whitespace-pre-wrap">
                {e.mensagem}
                {e.pilha ? `\n\n${e.pilha}` : ''}
                {e.user_agent ? `\n\nNavegador: ${e.user_agent}` : ''}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
