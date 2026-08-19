import { useEffect, useState } from 'react';
import { listOrders, deleteOrder, sendToErp, type Order } from '../services/ordersService';
import { fmt } from '../data';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [erro, setErro] = useState('');
  const [apagando, setApagando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);

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

  async function enviarParaErp(id: string, nome: string) {
    if (!confirm(`Confirmar pedido de ${nome} e lançar como venda no ERP?`)) return;
    setEnviando(id);
    try {
      const atualizado = await sendToErp(id);
      setOrders(prev => prev?.map(o => (o.id === id ? atualizado : o)) ?? null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível enviar pro ERP.');
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="adm-panel">
      <h2>Pedidos</h2>
      <p className="sub">Todos os pedidos feitos na loja. Confirme os que forem de verdade pra lançar como venda no ERP.</p>
      {erro ? (
        <div className="adm-empty">{erro}</div>
      ) : !orders ? (
        <div className="adm-empty">Carregando…</div>
      ) : orders.length === 0 ? (
        <div className="adm-empty">Nenhum pedido ainda — finalize uma compra na loja pra ver aqui.</div>
      ) : (
        <table className="adm-table">
          <thead>
            <tr><th>Cliente</th><th>Itens</th><th>Entrega</th><th>Total</th><th>Data</th><th>ERP</th><th></th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><b>{o.nome}</b><br />{o.telefone}</td>
                <td>
                  {o.itens.map((i, idx) => (
                    <div key={idx} style={{ marginBottom: o.itens.length > 1 ? 4 : 0 }}>
                      {i.nome}{i.quantidade > 1 ? ` × ${i.quantidade}` : ''}
                      {i.observacao && <div style={{ fontSize: 11, color: 'var(--graphite-faint)' }}>obs: {i.observacao}</div>}
                      {i.arte?.frente && (
                        <div style={{ fontSize: 11 }}>
                          📎 <a href={i.arte.frente.dataUrl} download={i.arte.frente.nome} style={{ color: 'var(--violet-deep)', fontWeight: 700 }}>
                            Baixar arte — frente ({i.arte.frente.nome})
                          </a>
                        </div>
                      )}
                      {i.arte?.verso && (
                        <div style={{ fontSize: 11 }}>
                          📎 <a href={i.arte.verso.dataUrl} download={i.arte.verso.nome} style={{ color: 'var(--violet-deep)', fontWeight: 700 }}>
                            Baixar arte — verso ({i.arte.verso.nome})
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </td>
                <td>{o.entrega}</td>
                <td>{fmt(o.total)}</td>
                <td>{new Date(o.criado_em).toLocaleString('pt-BR')}</td>
                <td>
                  {o.enviado_erp ? (
                    <span style={{ color: 'var(--violet-deep)', fontWeight: 700, fontSize: 12.5 }}>✓ {o.erp_numero}</span>
                  ) : (
                    <button className="adm-link-btn" style={{ color: 'var(--violet-deep)' }}
                      disabled={enviando === o.id} onClick={() => enviarParaErp(o.id, o.nome)}>
                      {enviando === o.id ? 'Enviando…' : 'Enviar pro ERP'}
                    </button>
                  )}
                </td>
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
