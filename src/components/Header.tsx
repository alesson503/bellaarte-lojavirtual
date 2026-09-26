import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import UploadModal from './UploadModal';
import LoginModal from './LoginModal';
import Logo from './Logo';
import { SearchIcon, UserIcon } from '../icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { usePromocao } from '../context/PromocaoContext';
import type { Page } from '../StoreApp';

// Extraído de StoreApp.tsx. "Produtos" e o carrinho já são rotas de verdade
// (/produtos, /carrinho); "Início" volta pra Home. Visual: protótipo
// `loja-virtual` (barra ink em cima, busca central arredondada, nav abaixo).
export default function Header({
  page,
  onGoPage,
  onOpenCart,
}: {
  page: Page | null;
  onGoPage: (next: Page, scrollToId?: string) => void;
  onOpenCart: () => void;
}) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { cart } = useCart();
  const { promocao } = usePromocao();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busca, setBusca] = useState('');

  function irParaInicio() {
    onGoPage('inicio');
    navigate('/');
    setMobileNavOpen(false);
  }
  function irParaProdutos() {
    navigate('/produtos');
    setMobileNavOpen(false);
  }
  function irParaSobre() {
    navigate('/', { state: { page: 'sobre' } });
    setMobileNavOpen(false);
  }
  function irParaContato() {
    navigate('/', { state: { page: 'contato' } });
    setMobileNavOpen(false);
  }

  function buscar(e: FormEvent) {
    e.preventDefault();
    navigate(busca.trim() ? `/produtos?busca=${encodeURIComponent(busca.trim())}` : '/produtos');
    setMobileNavOpen(false);
  }

  const linkCls = (ativo: boolean) =>
    `font-semibold hover:text-rose ${ativo ? 'text-rose' : 'text-ink-soft'}`;

  return (
    <>
      <div className="truncate whitespace-nowrap bg-ink px-4 py-1.5 text-center text-[11px] text-white sm:text-xs">
        🚚 Frete combinado direto com você pelo WhatsApp
        <span className="hidden sm:inline"> &middot; ✂️ Arte revisada antes de imprimir &middot; 💬 Atendimento rápido</span>
      </div>
      {promocao && (
        <div className="bg-rose px-4 py-2 text-center text-xs font-bold text-white">
          🎉 {promocao.nome} — {promocao.percentual}% OFF em toda a loja
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:gap-8">
          <Link to="/" onClick={irParaInicio} className="flex shrink-0 items-center gap-2 text-ink">
            <Logo size={44} />
            <span className="hidden leading-tight sm:block">
              <span className="block font-display text-lg font-extrabold tracking-tight">
                Bella <span className="text-rose">Arte</span>
              </span>
              <span className="block text-[9px] font-semibold uppercase tracking-widest text-faint">
                Gráfica &amp; Personalizados
              </span>
            </span>
          </Link>

          <form onSubmit={buscar} className="hidden flex-1 items-center gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-2 md:flex">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar canecas, adesivos, cartões e mais..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button type="submit" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-rose text-white">
              <SearchIcon />
            </button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full border border-cream-200 bg-white text-ink md:hidden" title="Buscar" onClick={() => setMobileNavOpen(o => !o)}>
              <SearchIcon />
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-cream-200 bg-white text-ink md:hidden" title="Menu" onClick={() => setMobileNavOpen(o => !o)}>
              {mobileNavOpen ? '✕' : '☰'}
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-cream-200 bg-white text-ink" title="Enviar minha arte" onClick={() => setUploadOpen(true)}>📎</button>
            <button className="relative grid h-9 w-9 place-items-center rounded-full bg-ink text-white" title="Carrinho" onClick={onOpenCart}>
              🛍️
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-rose text-[10px] font-bold">{cart.length}</span>
              )}
            </button>
            {user?.role === 'admin' && (
              <Link className="hidden rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-ink sm:inline-flex" to="/admin" title="Voltar pro painel administrativo">⚙️ Admin</Link>
            )}
            {user ? (
              <button className="hidden items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-ink sm:inline-flex" title={`Sair da conta de ${user.nome}`} onClick={() => { logout(); toast('Você saiu da sua conta.'); }}>
                <UserIcon /> {user.nome.split(' ')[0]} · Sair
              </button>
            ) : (
              <button className="hidden items-center gap-1.5 rounded-full border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-ink sm:inline-flex" title="Entrar / criar conta" onClick={() => setLoginOpen(true)}>
                <UserIcon /> Entrar
              </button>
            )}
          </div>
        </div>

        <nav className="mx-auto hidden max-w-6xl gap-7 px-4 pb-3 text-sm md:flex">
          <a className={linkCls(page === 'inicio')} onClick={irParaInicio}>Início</a>
          <a className={linkCls(location.pathname === '/produtos')} onClick={irParaProdutos}>Produtos</a>
          <a className={linkCls(page === 'sobre')} onClick={irParaSobre}>Sobre Nós</a>
          <a className={linkCls(page === 'contato')} onClick={irParaContato}>Contato</a>
        </nav>

        {mobileNavOpen && (
          <nav className="flex flex-col gap-1 border-t border-cream-200 bg-cream-50 px-4 py-3 md:hidden">
            <form onSubmit={buscar} className="mb-2 flex items-center gap-2 rounded-lg border border-cream-200 bg-cream-100 px-4 py-2">
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <SearchIcon />
            </form>
            <a className={`py-2.5 ${linkCls(page === 'inicio')}`} onClick={irParaInicio}>Início</a>
            <a className={`py-2.5 ${linkCls(location.pathname === '/produtos')}`} onClick={irParaProdutos}>Produtos</a>
            <a className={`py-2.5 ${linkCls(page === 'sobre')}`} onClick={irParaSobre}>Sobre Nós</a>
            <a className={`py-2.5 ${linkCls(page === 'contato')}`} onClick={irParaContato}>Contato</a>
            {user?.role === 'admin' && <Link className="py-2.5 font-semibold text-ink-soft" to="/admin">⚙️ Painel admin</Link>}
            {user ? (
              <a className="py-2.5 font-semibold text-ink-soft" onClick={() => { logout(); toast('Você saiu da sua conta.'); setMobileNavOpen(false); }}>Sair da conta</a>
            ) : (
              <a className="py-2.5 font-semibold text-ink-soft" onClick={() => { setLoginOpen(true); setMobileNavOpen(false); }}>Entrar / criar conta</a>
            )}
          </nav>
        )}
      </header>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
    </>
  );
}
