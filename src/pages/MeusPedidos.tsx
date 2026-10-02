import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../auth/AuthContext';
import { listMyOrders, type Order } from '../services/ordersService';
import { statusLabel, STATUS_COR } from '../statusPedido';
import { fmt } from '../data';

// Pedidos da própria conta — só os que a pessoa fez logada (pedido feito
// sem estar logada não tem como "achar o dono" depois, por isso não
// aparece aqui). Status vem de pedidos.status: "Recebemos seu pedido" já na
// hora da compra, "Em produção" sozinho quando o admin manda pro ERP; os
// de depois (pronto/entregue) ainda são manuais no admin — no futuro vêm
// da sincronização com o status da venda lá no ERP.
export default function MeusPedidos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Order[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user) return;
    listMyOrders().then(setPedidos).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao buscar seus pedidos.'));
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-2xl font-extrabold text-ink md:text-3xl">Meus Pedidos</h1>

        {!user ? (
          <div className="mt-8 rounded-2xl border border-cream-200 bg-white p-8 text-center">
            <p className="text-ink-muted">Entra na sua conta pra ver seus pedidos aqui.</p>
            <button onClick={() => navigate('/')} className="mt-4 rounded-full bg-ink px-6 py-2.5 font-bold text-cream-50">Voltar pro início</button>
          </div>
        ) : erro ? (
          <p className="mt-8 text-center text-rose">{erro}</p>
        ) : !pedidos ? (
          <p className="mt-8 text-center text-ink-muted">Carregando…</p>
        ) : pedidos.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-cream-200 bg-white p-8 text-center">
            <p className="text-ink-muted">Você ainda não fez nenhum pedido logada(o) — pedidos feitos sem estar logada(o) não aparecem aqui.</p>
            <button onClick={() => navigate('/produtos')} className="mt-4 rounded-full bg-rose px-6 py-2.5 font-bold text-white">Ver produtos</button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {pedidos.map(p => (
              <div key={p.id} className="rounded-2xl border border-cream-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-ink-muted">{new Date(p.criado_em).toLocaleString('pt-BR')}</p>
                    <p className="mt-1 font-display text-lg font-extrabold text-ink">{fmt(p.total)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATUS_COR[p.status] ?? 'bg-cream-200 text-ink-soft'}`}>
                    {statusLabel(p.status)}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 border-t border-cream-100 pt-3 text-sm text-ink-soft">
                  {p.itens.map((item, i) => (
                    <li key={i}>
                      {item.nome}{item.quantidade > 1 ? ` × ${item.quantidade}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
