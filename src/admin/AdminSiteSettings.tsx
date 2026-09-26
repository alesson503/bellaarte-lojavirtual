import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { trocarSenha } from '../auth/authService';
import { getConfig, setConfig } from '../services/configService';
import { SOBRE_NOS_PADRAO } from '../context/SobreNosContext';

export default function AdminSiteSettings() {
  return (
    <>
      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Configurações</h2>
        <p className="mt-1 text-sm text-ink-muted">
          WhatsApp, senha e o texto da página "Sobre Nós" — essas valem pra loja inteira, pra qualquer visitante.
          Textos da home, cores, logo e fotos ficam na aba <b>Aparência</b> (essa parte é só prévia, salva no navegador).
        </p>
      </div>

      <WhatsAppPanel />

      <SobreNosPanel />

      <TrocarSenhaPanel />
    </>
  );
}

function WhatsAppPanel() {
  const [numero, setNumero] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getConfig()
      .then(c => setNumero(c.whatsapp_numero || ''))
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar.'))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setErro(''); setOk(false);
    const limpo = numero.replace(/\D/g, '');
    if (!/^55\d{10,11}$/.test(limpo)) {
      setErro('Formato esperado: 55 + DDD + número, só dígitos (ex: 5511948991616).');
      return;
    }
    setSalvando(true);
    try {
      await setConfig('whatsapp_numero', limpo);
      setNumero(limpo);
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">WhatsApp</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Número usado nos botões de WhatsApp da loja (o flutuante e o da página de Contato) — vale pra todo mundo que visita, não só neste navegador.
      </p>
      {carregando ? (
        <p className="mt-4 text-sm text-ink-muted">Carregando…</p>
      ) : (
        <>
          <label className="mt-4 block max-w-xs">
            <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Número (com DDI 55 + DDD, só números)</span>
            <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="5511948991616"
              className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" />
          </label>
          {erro && <p className="mt-3 text-sm font-semibold text-rose">{erro}</p>}
          {ok && <p className="mt-3 text-sm font-semibold text-green-600">✓ Número salvo — já vale pra loja inteira.</p>}
          <button className="mt-3 rounded-full bg-rose px-6 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando…' : 'Salvar número'}
          </button>
        </>
      )}
    </div>
  );
}

function SobreNosPanel() {
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    getConfig()
      .then(c => setTexto(c.sobre_nos_texto || SOBRE_NOS_PADRAO))
      .catch(e => setErro(e instanceof Error ? e.message : 'Erro ao carregar.'))
      .finally(() => setCarregando(false));
  }, []);

  async function salvar() {
    setErro(''); setOk(false);
    if (!texto.trim()) { setErro('Escreva algum texto antes de salvar.'); return; }
    setSalvando(true);
    try {
      await setConfig('sobre_nos_texto', texto.trim());
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Página "Sobre Nós"</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Texto que aparece na página Sobre Nós da loja — vale pra todo mundo que visita, não só neste navegador.
        Pra separar parágrafos, deixe uma linha em branco entre eles.
      </p>
      {carregando ? (
        <p className="mt-4 text-sm text-ink-muted">Carregando…</p>
      ) : (
        <>
          <textarea rows={10} value={texto} onChange={e => setTexto(e.target.value)}
            className="mt-4 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" />
          {erro && <p className="mt-3 text-sm font-semibold text-rose">{erro}</p>}
          {ok && <p className="mt-3 text-sm font-semibold text-green-600">✓ Texto salvo — já vale pra loja inteira.</p>}
          <button className="mt-3 rounded-full bg-rose px-6 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando…' : 'Salvar texto'}
          </button>
        </>
      )}
    </div>
  );
}

function TrocarSenhaPanel() {
  const { user } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setErro('');
    setOk(false);
    if (senhaNova.length < 6) { setErro('A senha nova precisa ter pelo menos 6 caracteres.'); return; }
    if (senhaNova !== confirmar) { setErro('A confirmação não bate com a senha nova.'); return; }
    setEnviando(true);
    try {
      await trocarSenha(senhaAtual, senhaNova);
      setSenhaAtual(''); setSenhaNova(''); setConfirmar('');
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
      <h2 className="font-display text-lg font-bold text-ink">Sua senha</h2>
      <p className="mt-1 text-sm text-ink-muted">Troca a senha da conta que está logada agora{user ? <> ({user.email})</> : ''}.</p>
      <div className="mt-4 flex flex-col gap-3 max-w-xs">
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-soft">Senha atual</span>
          <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-soft">Senha nova</span>
          <input type="password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" /></label>
        <label className="block"><span className="mb-1.5 block text-sm font-semibold text-ink-soft">Confirmar senha nova</span>
          <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvar()} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" /></label>
      </div>
      {erro && <p className="mt-3 text-sm font-semibold text-rose">{erro}</p>}
      {ok && <p className="mt-3 text-sm font-semibold text-green-600">✓ Senha trocada com sucesso.</p>}
      <button className="mt-3 rounded-full bg-rose px-6 py-2.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-50" disabled={enviando} onClick={salvar}>
        {enviando ? 'Salvando…' : 'Trocar senha'}
      </button>
    </div>
  );
}
