import { useEffect, useState } from 'react';
import {
  listErpProducts, listLojaProducts, sincronizarProdutosErp,
  getAdesivoStatus, corrigirNomeAdesivo,
  type ErpProduto, type LojaProduto, type AdesivoCombo,
} from '../services/productsService';
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

      <AdesivoStatusPanel />

      <div className="adm-panel" style={{ marginTop: 20 }}>
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

function AdesivoStatusPanel() {
  const [combos, setCombos] = useState<AdesivoCombo[] | null>(null);
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<string | null>(null); // "material|acabamento"
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  function carregar() {
    getAdesivoStatus()
      .then(r => { setCombos(r.combos); setSugestoes(r.sugestoes); })
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar status do Adesivo.'));
  }

  useEffect(carregar, []);

  async function salvar(material: string, acabamento: string) {
    if (!novoNome.trim()) return;
    setSalvando(true);
    try {
      await corrigirNomeAdesivo(material, acabamento, novoNome.trim());
      setEditando(null);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao corrigir nome.');
    } finally {
      setSalvando(false);
    }
  }

  const foraDeSincronia = combos?.filter(c => !c.sincronizado) ?? [];

  return (
    <div className="adm-panel" style={{ marginTop: 20 }}>
      <h2>Preço do configurador de Adesivo</h2>
      <p className="sub">
        Preço puxado do ERP casando pelo nome exato do produto — igual os simples, mas em formato de calculadora
        (Material × Acabamento). Se um nome mudar lá, a loja mantém o último preço bom e avisa aqui.
      </p>

      {erro ? (
        <div className="adm-empty">{erro}</div>
      ) : !combos ? (
        <div className="adm-empty">Carregando…</div>
      ) : (
        <>
          {foraDeSincronia.length > 0 && (
            <div className="adm-hint" style={{ borderColor: 'var(--blush-deep)', marginBottom: 16 }}>
              ⚠️ {foraDeSincronia.length} combinaç{foraDeSincronia.length > 1 ? 'ões' : 'ão'} não {foraDeSincronia.length > 1 ? 'foram encontradas' : 'foi encontrada'} no ERP
              na última tentativa — a loja está usando o último preço conhecido (não quebrou pro cliente).
              {sugestoes.length > 0 && (
                <> Nomes parecidos no ERP agora: {sugestoes.map((s, i) => <span key={s}><b>"{s}"</b>{i < sugestoes.length - 1 ? ', ' : ''}</span>)}.</>
              )}
            </div>
          )}
          <table className="adm-table">
            <thead>
              <tr><th>Material</th><th>Acabamento</th><th>Preço</th><th>Nome esperado no ERP</th><th>Status</th></tr>
            </thead>
            <tbody>
              {combos.map(c => {
                const key = `${c.material}|${c.acabamento}`;
                return (
                  <tr key={key}>
                    <td>{c.material}</td>
                    <td>{c.acabamento}</td>
                    <td>{c.preco != null ? fmt(c.preco) : '—'}</td>
                    <td>
                      {editando === key ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
                            style={{ height: 32, borderRadius: 8, border: '1.5px solid var(--line)', padding: '0 8px', fontSize: 12.5, flex: 1 }} />
                          <button className="adm-link-btn" style={{ margin: 0 }} disabled={salvando} onClick={() => salvar(c.material, c.acabamento)}>
                            {salvando ? '...' : 'Salvar'}
                          </button>
                        </div>
                      ) : (
                        <span>{c.erp_nome_esperado}</span>
                      )}
                    </td>
                    <td>
                      {c.sincronizado ? (
                        <span style={{ color: 'var(--violet-deep)', fontWeight: 700, fontSize: 12.5 }}>✓ ok</span>
                      ) : editando === key ? null : (
                        <button className="adm-link-btn" style={{ color: 'var(--blush-deep)', margin: 0 }}
                          onClick={() => { setEditando(key); setNovoNome(c.erp_nome_esperado); }}>
                          ⚠️ corrigir nome
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
