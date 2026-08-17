import { listOrders } from '../services/ordersService';
import { fmt } from '../data';

export default function AdminOrders() {
  const orders = listOrders();

  return (
    <div className="adm-panel">
      <h2>Pedidos</h2>
      <p className="sub">Todos os pedidos de teste feitos na prévia da loja.</p>
      {orders.length === 0 ? (
        <div className="adm-empty">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Cliente</th><th>Itens</th><th>Entrega</th><th>Total</th><th>Data</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.nome}</b><br />{o.telefone}</td>
                <td>{o.itens.map(i => i.nome).join(', ')}</td>
                <td>{o.entrega}</td>
                <td>{fmt(o.total)}</td>
                <td>{new Date(o.criadoEm).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
