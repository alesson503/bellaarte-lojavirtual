import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { esqueciSenha } from '../auth/authService';

export default function LoginModal({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (nome: string) => void;
}) {
  const { login, register } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar' | 'esqueci'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [esqueciEnviado, setEsqueciEnviado] = useState(false);

  function limpar() {
    setNome(''); setEmail(''); setSenha(''); setErro(''); setEsqueciEnviado(false);
  }

  function fechar() {
    limpar();
    setModo('entrar');
    onClose();
  }

  async function submit() {
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'esqueci') {
        await esqueciSenha(email);
        setEsqueciEnviado(true);
        return;
      }
      const user = modo === 'entrar' ? await login(email, senha) : await register(nome, email, senha);
      const nomeParaSaudar = user.nome;
      limpar();
      onSuccess(nomeParaSaudar);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={fechar}>✕</button>
        <h2 className="serif">{modo === 'entrar' ? 'Entrar na minha conta' : modo === 'criar' ? 'Criar minha conta' : 'Recuperar senha'}</h2>
        <p className="modal-sub">
          {modo === 'entrar' ? 'Acesse pra acompanhar seus pedidos.' : modo === 'criar' ? 'Leva menos de um minuto.' : 'A gente manda um link pro seu e-mail pra você criar uma senha nova.'}
        </p>

        {modo !== 'esqueci' && (
          <div className="pills" style={{ marginBottom: 18 }}>
            <button className={`pill ${modo === 'entrar' ? 'on' : ''}`} onClick={() => { setErro(''); setModo('entrar'); }}>Entrar</button>
            <button className={`pill ${modo === 'criar' ? 'on' : ''}`} onClick={() => { setErro(''); setModo('criar'); }}>Criar conta</button>
          </div>
        )}

        {modo === 'esqueci' && esqueciEnviado ? (
          <div className="checkout-ok">✓ Se esse e-mail tiver uma conta aqui, mandamos um link de recuperação. Confira sua caixa de entrada (e o spam).</div>
        ) : (
          <>
            {modo === 'criar' && (
              <div className="field-group"><label>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
            )}
            <div className="field-group"><label>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" /></div>
            {modo !== 'esqueci' && (
              <div className="field-group"><label>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>
            )}

            {modo === 'entrar' && (
              <button type="button" onClick={() => { setErro(''); setModo('esqueci'); }} style={{ background: 'none', border: 'none', padding: 0, marginTop: -8, marginBottom: 16, fontSize: 12.5, color: 'var(--graphite)', textDecoration: 'underline', cursor: 'pointer' }}>
                Esqueci minha senha
              </button>
            )}

            {erro && <p style={{ color: 'var(--blush-deep)', fontSize: 12.5, marginTop: -6, marginBottom: 14 }}>{erro}</p>}

            <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={enviando}>
              {enviando ? 'Só um instante...' : modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Mandar link de recuperação'}
            </button>

            {modo === 'esqueci' && (
              <button type="button" onClick={() => { setErro(''); setModo('entrar'); }} style={{ background: 'none', border: 'none', padding: 0, marginTop: 14, fontSize: 12.5, color: 'var(--graphite)', textDecoration: 'underline', cursor: 'pointer' }}>
                ← Voltar pro login
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
