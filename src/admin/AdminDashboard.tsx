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

  if (erro) return <div className="adm-panel"><div className="adm-empty">{erro}</div></div>;
  if (!orders || clientesCount === null) return <div className="adm-panel"><div className="adm-empty">Carregando…</div></div>;

  const receita = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="adm-kpis">
        <div className="adm-kpi"><b>{orders.length}</b><span>pedidos</span></div>
        <div className="adm-kpi"><b>{fmt(receita)}</b><span>em pedidos</span></div>
        <div className="adm-kpi"><b>{clientesCount}</b><span>clientes cadastrados</span></div>
      </div>

      <div className="adm-panel">
        <h2>Últimos pedidos</h2>
        <p className="sub">Pedidos feitos na loja, salvos no banco de dados — aparecem aqui não importa de onde você acessa.</p>
        {orders.length === 0 ? (
          <div className="adm-empty">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</div>
        ) : (
          <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Cliente</th><th>Itens</th><th>Total</th><th>Data</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td><b>{o.nome}</b><br />{o.telefone}</td>
                  <td>{o.itens.length} item{o.itens.length !== 1 ? 's' : ''}</td>
                  <td>{fmt(o.total)}</td>
                  <td>{new Date(o.criado_em).toLocaleString('pt-BR')}</td>
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
