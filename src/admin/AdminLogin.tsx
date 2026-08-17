import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';
import './admin.css';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  function submit() {
    setErro('');
    try {
      const user = login(email, senha);
      if (user.role !== 'admin') {
        setErro('Essa conta não tem acesso ao painel admin.');
        return;
      }
      navigate('/admin');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.');
    }
  }

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <div className="adm-login-brand">
          <Logo size={36} />
          <div><b>Bella Arte</b><span>Painel administrativo</span></div>
        </div>

        <div className="field-group"><label>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@bellaarte.com" /></div>
        <div className="field-group"><label>Senha</label><input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} /></div>

        {erro && <p className="adm-error">{erro}</p>}

        <button className="btn-primary" style={{ width: '100%' }} onClick={submit}>Entrar no painel</button>

        <div className="adm-hint">
          Login local de teste — use <b>admin@bellaarte.com</b> / <b>admin123</b> até integrar com o seu sistema.
        </div>

        <Link className="adm-back" to="/">← Voltar para a loja</Link>
      </div>
    </div>
  );
}
