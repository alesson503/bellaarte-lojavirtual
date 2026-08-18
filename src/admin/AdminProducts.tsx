import { useEffect, useRef, useState } from 'react';
import {
  listErpProducts, listLojaProducts, sincronizarProdutosErp,
  getAdesivoStatus, corrigirNomeAdesivo, uploadImagemProduto, removerImagemProduto, atualizarDescontoProduto,
  atualizarDetalhesProduto,
  type ErpProduto, type LojaProduto, type AdesivoCombo,
} from '../services/productsService';
import { imageToDataUrl } from '../lib/imageToDataUrl';
import { fmt } from '../data';

export default function AdminProducts() {
  const [lojaProdutos, setLojaProdutos] = useState<LojaProduto[] | null>(null);
  const [erpProdutos, setErpProdutos] = useState<ErpProduto[] | null>(null);
  const [erro, setErro] = useState('');
  const [sincronizando, setSincronizando] = useState(false);
  const [msg, setMsg] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const alvoUploadRef = useRef<string | null>(null);
  const [editandoDesconto, setEditandoDesconto] = useState<string | null>(null);
  const [descontoValor, setDescontoValor] = useState('');
  const [salvandoDesconto, setSalvandoDesconto] = useState<string | null>(null);
  const [editandoDetalhes, setEditandoDetalhes] = useState<string | null>(null);
  const [descricaoValor, setDescricaoValor] = useState('');
  const [coresValor, setCoresValor] = useState('');
  const [especificacoesValor, setEspecificacoesValor] = useState('');
  const [salvandoDetalhes, setSalvandoDetalhes] = useState<string | null>(null);

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

  function pedirFoto(id: string) {
    alvoUploadRef.current = id;
    fileInputRef.current?.click();
  }

  async function onArquivoEscolhido(file: File | null) {
    const id = alvoUploadRef.current;
    if (!file || !id) return;
    setEnviandoFoto(id);
    try {
      const dataUrl = await imageToDataUrl(file, 600, 'image/jpeg', 0.85);
      await uploadImagemProduto(id, dataUrl);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível enviar essa imagem.');
    } finally {
      setEnviandoFoto(null);
    }
  }

  async function tirarFoto(id: string) {
    setEnviandoFoto(id);
    try {
      await removerImagemProduto(id);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível remover a foto.');
    } finally {
      setEnviandoFoto(null);
    }
  }

  async function salvarDesconto(id: string) {
    setSalvandoDesconto(id);
    try {
      const num = descontoValor.trim() === '' ? null : Number(descontoValor);
      await atualizarDescontoProduto(id, num);
      setEditandoDesconto(null);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível salvar o desconto.');
    } finally {
      setSalvandoDesconto(null);
    }
  }

  async function salvarDetalhes(id: string) {
    setSalvandoDetalhes(id);
    try {
      const cores = coresValor.split(',').map(c => c.trim()).filter(Boolean);
      const especificacoes = especificacoesValor.split('\n')
        .map(linha => {
          const i = linha.indexOf(':');
          if (i < 0) return null;
          const chave = linha.slice(0, i).trim();
          const valor = linha.slice(i + 1).trim();
          return chave && valor ? { chave, valor } : null;
        })
        .filter((e): e is { chave: string; valor: string } => e != null);
      await atualizarDetalhesProduto(id, descricaoValor.trim(), cores, especificacoes);
      setEditandoDetalhes(null);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível salvar os detalhes.');
    } finally {
      setSalvandoDetalhes(null);
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

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => onArquivoEscolhido(e.target.files?.[0] ?? null)} />

        {erro ? (
          <div className="adm-empty">{erro}</div>
        ) : !lojaProdutos ? (
          <div className="adm-empty">Carregando…</div>
        ) : lojaProdutos.length === 0 ? (
          <div className="adm-empty">Nenhum produto sincronizado ainda — clique em "Sincronizar agora".</div>
        ) : (
          <table className="adm-table" style={{ marginTop: 16 }}>
            <thead>
              <tr><th>Foto</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Desconto</th><th>Descrição / cores</th><th></th></tr>
            </thead>
            <tbody>
              {lojaProdutos.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--paper)', border: '1px dashed var(--line)' }} />
                    )}
                  </td>
                  <td><b>{p.nome}</b></td>
                  <td>{p.categoria}</td>
                  <td>
                    {p.desconto_percentual > 0 && <span className="old-price">{fmt(p.preco_original)}</span>}
                    {fmt(p.preco)}{p.unidade && <small> /{p.unidade}</small>}
                  </td>
                  <td>
                    {editandoDesconto === p.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input value={descontoValor} onChange={e => setDescontoValor(e.target.value)} placeholder="0"
                          style={{ width: 56, height: 32, borderRadius: 8, border: '1.5px solid var(--line)', padding: '0 8px', fontSize: 12.5 }} />
                        <span style={{ fontSize: 12 }}>%</span>
                        <button className="adm-link-btn" style={{ margin: 0 }} disabled={salvandoDesconto === p.id} onClick={() => salvarDesconto(p.id)}>
                          {salvandoDesconto === p.id ? '...' : 'Salvar'}
                        </button>
                      </div>
                    ) : (
                      <button className="adm-link-btn" style={{ margin: 0 }}
                        onClick={() => { setEditandoDesconto(p.id); setDescontoValor(p.desconto_percentual > 0 ? String(p.desconto_percentual) : ''); }}>
                        {p.desconto_percentual > 0 ? `-${p.desconto_percentual}% · editar` : 'Definir desconto'}
                      </button>
                    )}
                  </td>
                  <td>
                    {editandoDetalhes === p.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
                        <textarea value={descricaoValor} onChange={e => setDescricaoValor(e.target.value)} placeholder="Descrição do produto"
                          rows={2} style={{ borderRadius: 8, border: '1.5px solid var(--line)', padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical' }} />
                        <input value={coresValor} onChange={e => setCoresValor(e.target.value)} placeholder="Cores, separadas por vírgula"
                          style={{ height: 32, borderRadius: 8, border: '1.5px solid var(--line)', padding: '0 8px', fontSize: 12.5 }} />
                        <textarea value={especificacoesValor} onChange={e => setEspecificacoesValor(e.target.value)}
                          placeholder={'Especificações, uma por linha:\nFormato: 9,7×20,5cm\nMaterial: Porcelana'}
                          rows={4} style={{ borderRadius: 8, border: '1.5px solid var(--line)', padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical' }} />
                        <button className="adm-link-btn" style={{ margin: 0, alignSelf: 'flex-start' }} disabled={salvandoDetalhes === p.id} onClick={() => salvarDetalhes(p.id)}>
                          {salvandoDetalhes === p.id ? 'Salvando…' : 'Salvar'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ maxWidth: 240 }}>
                        {p.descricao && <div style={{ fontSize: 12, color: 'var(--graphite)', marginBottom: 4 }}>{p.descricao}</div>}
                        {p.cores?.length ? (
                          <div style={{ fontSize: 11.5, color: 'var(--graphite-faint)', marginBottom: 4 }}>Cores: {p.cores.join(', ')}</div>
                        ) : null}
                        {p.especificacoes?.length ? (
                          <div style={{ fontSize: 11.5, color: 'var(--graphite-faint)', marginBottom: 4 }}>
                            {p.especificacoes.map(e => `${e.chave}: ${e.valor}`).join(' · ')}
                          </div>
                        ) : null}
                        <button className="adm-link-btn" style={{ margin: 0 }}
                          onClick={() => {
                            setEditandoDetalhes(p.id);
                            setDescricaoValor(p.descricao || '');
                            setCoresValor((p.cores || []).join(', '));
                            setEspecificacoesValor((p.especificacoes || []).map(e => `${e.chave}: ${e.valor}`).join('\n'));
                          }}>
                          {p.descricao || p.cores?.length || p.especificacoes?.length ? 'Editar detalhes' : 'Adicionar descrição/cores'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    {enviandoFoto === p.id ? (
                      <span style={{ fontSize: 12, color: 'var(--graphite-faint)' }}>...</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="adm-link-btn" style={{ margin: 0 }} onClick={() => pedirFoto(p.id)}>
                          {p.imagem_url ? 'Trocar foto' : 'Subir foto'}
                        </button>
                        {p.imagem_url && (
                          <button className="adm-link-btn" style={{ margin: 0, color: 'var(--blush-deep)' }} onClick={() => tirarFoto(p.id)}>
                            Remover
                          </button>
                        )}
                      </div>
                    )}
                  </td>
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
              <tr><th>Foto</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Unidade</th></tr>
            </thead>
            <tbody>
              {erpProdutos.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    ) : '—'}
                  </td>
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
