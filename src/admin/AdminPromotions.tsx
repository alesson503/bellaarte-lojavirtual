import { useEffect, useState } from 'react';
import { listPromocoes, criarPromocao, atualizarPromocao, apagarPromocao, type Promocao } from '../services/promocaoService';

function paraInputDatetime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function estaAtiva(p: Promocao) {
  const agora = new Date();
  return p.ativo && new Date(p.data_inicio) <= agora && agora <= new Date(p.data_fim);
}

export default function AdminPromotions() {
  const [promocoes, setPromocoes] = useState<Promocao[] | null>(null);
  const [erro, setErro] = useState('');
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [percentual, setPercentual] = useState('10');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');

  function carregar() {
    listPromocoes().then(setPromocoes).catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar promoções.'));
  }

  useEffect(carregar, []);

  async function criar() {
    setErro('');
    if (!nome.trim() || !inicio || !fim) { setErro('Preencha nome, data de início e data de fim.'); return; }
    setCriando(true);
    try {
      await criarPromocao({ nome: nome.trim(), percentual: Number(percentual), data_inicio: new Date(inicio).toISOString(), data_fim: new Date(fim).toISOString() });
      setNome(''); setPercentual('10'); setInicio(''); setFim('');
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao criar promoção.');
    } finally {
      setCriando(false);
    }
  }

  async function alternarAtivo(p: Promocao) {
    try {
      await atualizarPromocao(p.id, { ativo: !p.ativo });
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao atualizar.');
    }
  }

  async function apagar(p: Promocao) {
    if (!confirm(`Apagar a promoção "${p.nome}"?`)) return;
    try {
      await apagarPromocao(p.id);
      carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao apagar.');
    }
  }

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Nova promoção</h2>
        <p className="sub">
          Vale pra loja inteira — produtos simples e todos os configuradores (Adesivo, Cartão de Visita, Banner, Placa PS, Panfletos).
          Liga e desliga sozinha nas datas escolhidas. Se um produto já tiver desconto próprio maior, o dele continua valendo.
        </p>
        {erro && <p className="adm-error">{erro}</p>}
        <div className="field-group"><label>Nome (ex: Dia dos Pais)</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Promoção de inauguração" /></div>
        <div className="field-group"><label>Percentual de desconto</label><input value={percentual} onChange={e => setPercentual(e.target.value)} placeholder="10" /></div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <div className="field-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Início</label>
            <input type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} />
          </div>
          <div className="field-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Fim</label>
            <input type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" disabled={criando} onClick={criar}>{criando ? 'Criando…' : 'Criar promoção'}</button>
      </div>

      <div className="adm-panel">
        <h2>Promoções cadastradas</h2>
        <p className="sub">Passadas, ativas agora e futuras.</p>
        {!promocoes ? (
          <div className="adm-empty">Carregando…</div>
        ) : promocoes.length === 0 ? (
          <div className="adm-empty">Nenhuma promoção cadastrada ainda.</div>
        ) : (
          <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Nome</th><th>Desconto</th><th>Início</th><th>Fim</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {promocoes.map(p => (
                <tr key={p.id}>
                  <td><b>{p.nome}</b></td>
                  <td>{p.percentual}%</td>
                  <td>{paraInputDatetime(p.data_inicio).replace('T', ' ')}</td>
                  <td>{paraInputDatetime(p.data_fim).replace('T', ' ')}</td>
                  <td>
                    {estaAtiva(p) ? (
                      <span style={{ color: 'var(--violet-deep)', fontWeight: 700, fontSize: 12.5 }}>● ativa agora</span>
                    ) : !p.ativo ? (
                      <span style={{ color: 'var(--graphite-faint)', fontSize: 12.5 }}>desligada</span>
                    ) : new Date(p.data_fim) < new Date() ? (
                      <span style={{ color: 'var(--graphite-faint)', fontSize: 12.5 }}>encerrada</span>
                    ) : (
                      <span style={{ color: 'var(--graphite-faint)', fontSize: 12.5 }}>agendada</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="adm-link-btn" style={{ margin: 0 }} onClick={() => alternarAtivo(p)}>
                        {p.ativo ? 'Desligar' : 'Ligar'}
                      </button>
                      <button className="adm-link-btn" style={{ margin: 0, color: 'var(--blush-deep)' }} onClick={() => apagar(p)}>
                        Apagar
                      </button>
                    </div>
                  </td>
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
