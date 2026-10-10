import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { redefinirSenha } from '../auth/authService';

// Página que o link do e-mail de "esqueci minha senha" abre
// (/redefinir-senha?token=...). Não precisa estar logado — é exatamente
// pra quem não consegue entrar.
export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    setErro('');
    if (!token) { setErro('Link inválido — peça a recuperação de novo.'); return; }
    if (senha.length < 6) { setErro('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setErro('A confirmação não bate com a senha.'); return; }
    setEnviando(true);
    try {
      await redefinirSenha(token, senha);
      setOk(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-14">
        <h1 className="font-display text-2xl font-extrabold text-ink">Criar nova senha</h1>

        {!token ? (
          <p className="mt-6 text-rose">Esse link é inválido. Peça a recuperação de novo na tela de login.</p>
        ) : ok ? (
          <div className="mt-6 rounded-2xl border border-cream-200 bg-white p-6 text-center">
            <p className="text-ink-soft">✓ Senha trocada! Já pode entrar com a senha nova.</p>
            <button onClick={() => navigate('/')} className="mt-4 rounded-full bg-rose px-6 py-2.5 font-bold text-white">Ir pra loja</button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Senha nova</span>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Confirmar senha nova</span>
              <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} onKeyDown={e => e.key === 'Enter' && salvar()} className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose" />
            </label>
            {erro && <p className="text-sm font-semibold text-rose">{erro}</p>}
            <button onClick={salvar} disabled={enviando} className="rounded-full bg-rose px-6 py-2.5 font-bold text-white disabled:opacity-50">
              {enviando ? 'Salvando…' : 'Salvar senha nova'}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
