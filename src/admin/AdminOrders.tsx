import { useEffect, useState } from 'react';
import { listOrders, deleteOrder, type Order } from '../services/ordersService';
import { fmt } from '../data';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [erro, setErro] = useState('');
  const [apagando, setApagando] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    listOrders().then(setOrders).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar pedidos.'));
  }

  async function apagar(id: string, nome: string) {
    if (!confirm(`Apagar o pedido de ${nome}? Essa ação não pode ser desfeita.`)) return;
    setApagando(id);
    try {
      await deleteOrder(id);
      setOrders(prev => prev?.filter(o => o.id !== id) ?? null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível apagar o pedido.');
    } finally {
      setApagando(null);
    }
  }

  return (
    <div className="adm-panel">
      <h2>Pedidos</h2>
      <p className="sub">Todos os pedidos feitos na loja.</p>
      {erro ? (
        <div className="adm-empty">{erro}</div>
      ) : !orders ? (
        <div className="adm-empty">Carregando…</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Cliente</th><th>Itens</th><th>Entrega</th><th>Total</th><th>Data</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.nome}</b><br />{o.telefone}</td>
                <td>{o.itens.map(i => i.nome).join(', ')}</td>
                <td>{o.entrega}</td>
                <td>{fmt(o.total)}</td>
                <td>{new Date(o.criado_em).toLocaleString('pt-BR')}</td>
                <td>
                  <button className="adm-link-btn" style={{ color: 'var(--blush-deep)' }}
                    disabled={apagando === o.id} onClick={() => apagar(o.id, o.nome)}>
                    {apagando === o.id ? 'Apagando…' : 'Apagar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
