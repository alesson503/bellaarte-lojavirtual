import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoginModal({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (nome: string) => void;
}) {
  const { login, register } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  function limpar() {
    setNome(''); setEmail(''); setSenha(''); setErro('');
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
        <h2 className="serif">{modo === 'entrar' ? 'Entrar na minha conta' : 'Criar minha conta'}</h2>
        <p className="modal-sub">
          {modo === 'entrar' ? 'Acesse pra acompanhar seus pedidos.' : 'Leva menos de um minuto.'}
        </p>

        <div className="pills" style={{ marginBottom: 18 }}>
          <button className={`pill ${modo === 'entrar' ? 'on' : ''}`} onClick={() => { setErro(''); setModo('entrar'); }}>Entrar</button>
          <button className={`pill ${modo === 'criar' ? 'on' : ''}`} onClick={() => { setErro(''); setModo('criar'); }}>Criar conta</button>
        </div>

        {modo === 'criar' && (
          <div className="field-group"><label>Nome</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" /></div>
        )}
        <div className="field-group"><label>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" /></div>
        <div className="field-group"><label>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>

        {erro && <p style={{ color: 'var(--blush-deep)', fontSize: 12.5, marginTop: -6, marginBottom: 14 }}>{erro}</p>}

        <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={enviando}>
          {enviando ? 'Só um instante...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </div>
    </div>
  );
}
