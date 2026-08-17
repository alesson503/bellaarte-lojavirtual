import { listOrders } from '../services/ordersService';
import { listCustomers } from '../auth/authService';
import { fmt } from '../data';

export default function AdminDashboard() {
  const orders = listOrders();
  const clientes = listCustomers();
  const receita = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="adm-kpis">
        <div className="adm-kpi"><b>{orders.length}</b><span>pedidos de teste</span></div>
        <div className="adm-kpi"><b>{fmt(receita)}</b><span>em pedidos (teste)</span></div>
        <div className="adm-kpi"><b>{clientes.length}</b><span>clientes cadastrados</span></div>
      </div>

      <div className="adm-panel">
        <h2>Últimos pedidos</h2>
        <p className="sub">Pedidos feitos na prévia da loja (guardados localmente, ainda não no seu sistema real).</p>
        {orders.length === 0 ? (
          <div className="adm-empty">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</div>
        ) : (
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
                  <td>{new Date(o.criadoEm).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
