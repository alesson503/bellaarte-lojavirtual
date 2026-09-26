import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listErpProducts, listLojaProducts, sincronizarProdutosErp,
  getAdesivoStatus, corrigirNomeAdesivo,
  listCatalogoFixoImagens, uploadImagemCatalogoFixo, removerImagemCatalogoFixo,
  type ErpProduto, type LojaProduto, type AdesivoCombo,
} from '../services/productsService';
import { fmt, GRUPOS_CATALOGO } from '../data';
import { imageToDataUrl } from '../lib/imageToDataUrl';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [lojaProdutos, setLojaProdutos] = useState<LojaProduto[] | null>(null);
  const [erpProdutos, setErpProdutos] = useState<ErpProduto[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [msg, setMsg] = useState('');

  function carregar() {
    listLojaProducts().then(setLojaProdutos).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar produtos da loja.'));
    listErpProducts().then(setErpProdutos).catch(() => {});
  }

  useEffect(carregar, []);

  const filtrados = useMemo(() => {
    if (!lojaProdutos) return null;
    const termo = busca.trim().toLowerCase();
    if (!termo) return lojaProdutos;
    return lojaProdutos.filter(p => p.nome.toLowerCase().includes(termo) || p.categoria.toLowerCase().includes(termo));
  }, [lojaProdutos, busca]);

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
      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Produtos na vitrine</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Produtos simples (preço fixo) puxados do seu ERP automaticamente a cada 30 minutos — são esses que aparecem
              no catálogo da loja. Adesivo, Cartão de Visita e Banner continuam com o configurador próprio, não entram aqui.
            </p>
          </div>
          <button
            className="whitespace-nowrap rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-rose hover:text-rose disabled:opacity-50"
            disabled={sincronizando} onClick={sincronizar}
          >
            {sincronizando ? '🔄 Sincronizando…' : '🔄 Sincronizar agora'}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm font-semibold text-rose">{msg}</p>}

        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar produto ou categoria..."
          className="mt-4 w-full max-w-xs rounded-2xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm outline-none focus:border-rose"
        />

        {erro ? (
          <p className="mt-4 text-center text-sm text-ink-muted">{erro}</p>
        ) : !filtrados ? (
          <p className="mt-4 text-center text-sm text-ink-muted">Carregando…</p>
        ) : filtrados.length === 0 ? (
          <p className="mt-4 text-center text-sm text-ink-muted">Nenhum produto encontrado.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-cream-200">
            <table className="w-full min-w-170 text-left text-sm">
              <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="p-3">Produto</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Disponível</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id} className="border-b border-cream-100 last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.imagem_url ? (
                          <img src={p.imagem_url} alt={p.nome} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-cream-200 bg-cream-50" />
                        )}
                        <button className="font-semibold text-ink hover:text-rose hover:underline" onClick={() => navigate(`/admin/produtos/${p.id}`, { state: { produto: p } })}>{p.nome}</button>
                      </div>
                    </td>
                    <td className="p-3 text-ink-muted">{p.categoria}</td>
                    <td className="p-3">
                      {p.desconto_percentual > 0 && <span className="mr-1.5 text-ink-muted line-through">{fmt(p.preco_original)}</span>}
                      <span className="font-semibold text-ink">{fmt(p.preco)}</span>{p.unidade && <span className="text-ink-muted"> /{p.unidade}</span>}
                      {p.desconto_percentual > 0 && <span className="ml-2 rounded-full bg-rose px-2 py-0.5 text-xs font-bold text-white">-{p.desconto_percentual}%</span>}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-cream-200 text-ink-muted'}`}>
                        {p.ativo ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="font-semibold text-rose hover:underline" onClick={() => navigate(`/admin/produtos/${p.id}`, { state: { produto: p } })}>Editar produto</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdesivoStatusPanel />

      <ImagensCatalogoFixoPanel />

      <div className="mt-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Catálogo completo do ERP</h2>
        <p className="mt-1 text-sm text-ink-muted">Todos os produtos ativos no ERP (inclusive os que já têm configurador na loja e por isso não entram na vitrine acima) — só pra conferência.</p>
        {!erpProdutos ? (
          <p className="mt-4 text-center text-sm text-ink-muted">Carregando…</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-cream-200">
            <table className="w-full min-w-140 text-left text-sm">
              <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted">
                <tr><th className="p-3">Foto</th><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3">Unidade</th></tr>
              </thead>
              <tbody>
                {erpProdutos.map(p => (
                  <tr key={p.id} className="border-b border-cream-100 last:border-0">
                    <td className="p-3">
                      {p.foto_url ? <img src={p.foto_url} alt={p.nome} className="h-9 w-9 rounded-lg object-cover" /> : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="p-3"><b className="text-ink">{p.nome}</b></td>
                    <td className="p-3 text-ink-muted">{p.categoria}</td>
                    <td className="p-3 font-semibold text-ink">{fmt(p.preco)}</td>
                    <td className="p-3 text-ink-muted">{p.unidade_venda === 'm2' ? 'por m²' : 'por unidade'}</td>
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
    <div className="mt-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Preço do configurador de Adesivo</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Preço puxado do ERP casando pelo nome exato do produto — igual os simples, mas em formato de calculadora
        (Material × Acabamento). Se um nome mudar lá, a loja mantém o último preço bom e avisa aqui.
      </p>

      {erro ? (
        <p className="mt-4 text-center text-sm text-ink-muted">{erro}</p>
      ) : !combos ? (
        <p className="mt-4 text-center text-sm text-ink-muted">Carregando…</p>
      ) : (
        <>
          {foraDeSincronia.length > 0 && (
            <div className="mt-4 rounded-xl border border-rose bg-rose-50 p-3 text-sm text-ink">
              ⚠️ {foraDeSincronia.length} combinaç{foraDeSincronia.length > 1 ? 'ões' : 'ão'} não {foraDeSincronia.length > 1 ? 'foram encontradas' : 'foi encontrada'} no ERP
              na última tentativa — a loja está usando o último preço conhecido (não quebrou pro cliente).
              {sugestoes.length > 0 && (
                <> Nomes parecidos no ERP agora: {sugestoes.map((s, i) => <span key={s}><b>"{s}"</b>{i < sugestoes.length - 1 ? ', ' : ''}</span>)}.</>
              )}
            </div>
          )}
          <div className="mt-4 overflow-x-auto rounded-xl border border-cream-200">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted">
                <tr><th className="p-3">Material</th><th className="p-3">Acabamento</th><th className="p-3">Preço</th><th className="p-3">Nome esperado no ERP</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {combos.map(c => {
                  const key = `${c.material}|${c.acabamento}`;
                  return (
                    <tr key={key} className="border-b border-cream-100 last:border-0">
                      <td className="p-3">{c.material}</td>
                      <td className="p-3">{c.acabamento}</td>
                      <td className="p-3 font-semibold text-ink">{c.preco != null ? fmt(c.preco) : '—'}</td>
                      <td className="p-3">
                        {editando === key ? (
                          <div className="flex gap-1.5">
                            <input value={novoNome} onChange={e => setNovoNome(e.target.value)}
                              className="h-8 flex-1 rounded-lg border border-cream-200 px-2 text-sm outline-none focus:border-rose" />
                            <button className="font-semibold text-rose hover:underline" disabled={salvando} onClick={() => salvar(c.material, c.acabamento)}>
                              {salvando ? '...' : 'Salvar'}
                            </button>
                          </div>
                        ) : (
                          <span>{c.erp_nome_esperado}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {c.sincronizado ? (
                          <span className="text-xs font-bold text-rose">✓ ok</span>
                        ) : editando === key ? null : (
                          <button className="text-xs font-bold text-rose hover:underline"
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
          </div>
        </>
      )}
    </div>
  );
}

// Panfletos, Wind Banner, Placa PS, Banner/Lona… vêm do ERP como vários
// itens soltos e a loja junta num card só (ver useProdutos.ts). Essa é a
// foto de capa do card do grupo — opcional: sem ela, usa a foto do
// primeiro item do ERP, ou o ícone da categoria.
const PRODUTOS_CATALOGO_FIXO = GRUPOS_CATALOGO;

function ImagensCatalogoFixoPanel() {
  const [imagens, setImagens] = useState<Record<string, string> | null>(null);
  const [erro, setErro] = useState('');
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const alvoIdRef = useRef<string | null>(null);

  function carregar() {
    listCatalogoFixoImagens().then(setImagens).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar imagens.'));
  }

  useEffect(carregar, []);

  function pedirFoto(id: string) {
    alvoIdRef.current = id;
    fileInputRef.current?.click();
  }

  async function onArquivoEscolhido(file: File | null) {
    const id = alvoIdRef.current;
    if (!file || !id) return;
    setEnviandoId(id);
    try {
      const dataUrl = await imageToDataUrl(file, 600, 'image/jpeg', 0.85);
      await uploadImagemCatalogoFixo(id, dataUrl);
      setImagens(prev => ({ ...prev, [id]: dataUrl }));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível enviar essa imagem.');
    } finally {
      setEnviandoId(null);
    }
  }

  async function remover(id: string) {
    setEnviandoId(id);
    try {
      await removerImagemCatalogoFixo(id);
      setImagens(prev => { const next = { ...prev }; delete next[id]; return next; });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível remover a foto.');
    } finally {
      setEnviandoId(null);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Fotos do catálogo fixo</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Panfletos, Wind Banner, Placa PS e Banner/Lona têm preço calculado (não vêm do ERP), então não têm foto
        cadastrada em lugar nenhum — sem uma foto aqui, o card mostra o ícone da categoria.
      </p>

      {erro ? (
        <p className="mt-4 text-center text-sm text-ink-muted">{erro}</p>
      ) : !imagens ? (
        <p className="mt-4 text-center text-sm text-ink-muted">Carregando…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-cream-200">
          <table className="w-full min-w-140 text-left text-sm">
            <thead className="border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted">
              <tr><th className="p-3">Foto</th><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {PRODUTOS_CATALOGO_FIXO.map(p => {
                const foto = imagens[p.id];
                return (
                  <tr key={p.id} className="border-b border-cream-100 last:border-0">
                    <td className="p-3">
                      {foto ? (
                        <img src={foto} alt={p.nome} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-dashed border-cream-200 bg-cream-50" />
                      )}
                    </td>
                    <td className="p-3"><b className="text-ink">{p.nome}</b></td>
                    <td className="p-3 text-ink-muted">{p.categoria}</td>
                    <td className="p-3">
                      {enviandoId === p.id ? (
                        <span className="text-sm text-ink-muted">Enviando…</span>
                      ) : (
                        <div className="flex gap-3">
                          <button className="font-semibold text-rose hover:underline" onClick={() => pedirFoto(p.id)}>
                            {foto ? 'Trocar foto' : 'Subir foto'}
                          </button>
                          {foto && (
                            <button className="font-semibold text-rose hover:underline" onClick={() => remover(p.id)}>
                              Remover foto
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => onArquivoEscolhido(e.target.files?.[0] ?? null)} />
    </div>
  );
}
