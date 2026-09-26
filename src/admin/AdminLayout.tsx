import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Painel', icon: '📊', end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: '📋', end: false },
  { to: '/admin/produtos', label: 'Produtos', icon: '🛍️', end: false },
  { to: '/admin/promocoes', label: 'Promoções', icon: '🏷️', end: false },
  { to: '/admin/aparencia', label: 'Aparência', icon: '🎨', end: false },
  { to: '/admin/configuracoes', label: 'Configurações', icon: '⚙️', end: false },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Enquanto confirma a sessão com o servidor, não decide nada ainda —
  // senão redireciona pro login por engano logo no primeiro instante.
  if (loading) return <div className="grid min-h-screen place-items-center text-ink-muted">Carregando…</div>;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  function sair() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-cream-50">
      <aside className="flex w-60 shrink-0 flex-col bg-ink p-5 text-cream-100">
        <div className="flex items-center gap-2.5 pb-6">
          <Logo size={34} />
          <div className="leading-tight">
            <b className="block font-display text-base font-extrabold text-cream-50">Bella Arte</b>
            <span className="text-xs text-cream-200">Painel admin</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-rose text-white' : 'text-cream-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-white/10 pt-4">
          <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-cream-200 hover:bg-white/10 hover:text-white" to="/">
            🏠 Ver a loja
          </Link>
          <button className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-cream-100 hover:bg-white/20" onClick={sair}>
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold text-ink">Painel administrativo</h1>
          <div className="rounded-full border border-cream-200 bg-white px-4 py-1.5 text-sm text-ink-muted">
            Olá, <b className="text-ink">{user.nome}</b>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
