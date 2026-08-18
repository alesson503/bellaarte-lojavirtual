import { useEffect, useState } from 'react';
import { listErpProducts, listLojaProducts, sincronizarProdutosErp, type ErpProduto, type LojaProduto } from '../services/productsService';
import { fmt } from '../data';

export default function AdminProducts() {
  const [lojaProdutos, setLojaProdutos] = useState<LojaProduto[] | null>(null);
  const [erpProdutos, setErpProdutos] = useState<ErpProduto[] | null>(null);
  const [erro, setErro] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [msg, setMsg] = useState('');

  function carregar() {
    listLojaProducts().then(setLojaProdutos).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar produtos da loja.'));
    listErpProducts().then(setErpProdutos).catch(() => {});
  }

  useEffect(carregar, []);

  async function sincronizar() {
    setSincronizando(true);
    setMsg('');
    try {
      const r = await sincronizarProdutosErp();
      setMsg(`✓ Sincronizado — ${r.total} produtos simples atualizados.`);
      carregar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro ao sincronizar.');
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2>Produtos na vitrine</h2>
            <p className="sub">
              Produtos simples (preço fixo) puxados do seu ERP automaticamente a cada 30 minutos — são esses que aparecem
              no catálogo da loja. Adesivo, Cartão de Visita e Banner continuam com o configurador próprio, não entram aqui.
            </p>
          </div>
          <button className="btn-outline-full" style={{ whiteSpace: 'nowrap' }} disabled={sincronizando} onClick={sincronizar}>
            {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
          </button>
        </div>
        {msg && <p style={{ fontSize: 12.5, color: 'var(--violet-deep)', marginTop: 10 }}>{msg}</p>}

        {erro ? (
          <div className="adm-empty">{erro}</div>
        ) : !lojaProdutos ? (
          <div className="adm-empty">Carregando…</div>
        ) : lojaProdutos.length === 0 ? (
          <div className="adm-empty">Nenhum produto sincronizado ainda — clique em "Sincronizar agora".</div>
        ) : (
          <table className="adm-table" style={{ marginTop: 16 }}>
            <thead>
              <tr><th>Nome</th><th>Categoria</th><th>Preço</th></tr>
            </thead>
            <tbody>
              {lojaProdutos.map(p => (
                <tr key={p.id}>
                  <td><b>{p.nome}</b></td>
                  <td>{p.categoria}</td>
                  <td>{fmt(p.preco)}{p.unidade && <small> /{p.unidade}</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="adm-panel">
        <h2>Catálogo completo do ERP</h2>
        <p className="sub">Todos os produtos ativos no ERP (inclusive os que já têm configurador na loja e por isso não entram na vitrine acima) — só pra conferência.</p>
        {!erpProdutos ? (
          <div className="adm-empty">Carregando…</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Nome</th><th>Categoria</th><th>Preço</th><th>Unidade</th></tr>
            </thead>
            <tbody>
              {erpProdutos.map(p => (
                <tr key={p.id}>
                  <td><b>{p.nome}</b></td>
                  <td>{p.categoria}</td>
                  <td>{fmt(p.preco)}</td>
                  <td>{p.unidade_venda === 'm2' ? 'por m²' : 'por unidade'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
