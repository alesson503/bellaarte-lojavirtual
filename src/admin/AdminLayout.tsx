import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', end: false },
  { to: '/admin/produtos', label: 'Produtos', end: false },
  { to: '/admin/promocoes', label: 'Promoções', end: false },
  { to: '/admin/configuracoes', label: 'Configurações', end: false },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Enquanto confirma a sessão com o servidor, não decide nada ainda —
  // senão redireciona pro login por engano logo no primeiro instante.
  if (loading) return <div className="adm-login-wrap">Carregando…</div>;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  function sair() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-login-brand">
          <Logo size={34} />
          <div><b>Bella Arte</b><span>Admin</span></div>
        </div>
        <nav className="adm-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>
          ))}
        </nav>
        <div className="adm-sidebar-foot">
          <Link className="adm-store-link" to="/">← Ver a loja</Link>
          <button className="adm-logout-btn" style={{ width: '100%' }} onClick={sair}>Sair</button>
        </div>
      </aside>
      <main className="adm-main">
        <div className="adm-topbar">
          <h1 className="serif">Painel administrativo</h1>
          <div className="adm-user-chip">Olá, <b>{user.nome}</b></div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
