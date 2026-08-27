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
import { useProdutos } from '../hooks/useProdutos';
import type { Page } from '../StoreApp';

// Extraído de StoreApp.tsx. "Produtos" e o carrinho já são rotas de verdade
// (/produtos, /carrinho); "Início" volta pra Home. As demais páginas-seção
// (Como funciona/Contato) saíram do cabeçalho — o menu principal agora é
// por categoria (redesign aprovado), igual navegar num catálogo de verdade.
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
  const { catalogo } = useProdutos();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const categorias = Array.from(new Set(catalogo.map(p => p.categoria))).sort();
  const categoriaAtiva = location.pathname === '/produtos' ? new URLSearchParams(location.search).get('categoria') : null;

  function irParaCategoria(categoria: string | null) {
    navigate(categoria ? `/produtos?categoria=${encodeURIComponent(categoria)}` : '/produtos');
    setMobileNavOpen(false);
  }

  function buscar(e: FormEvent) {
    e.preventDefault();
    navigate(busca.trim() ? `/produtos?busca=${encodeURIComponent(busca.trim())}` : '/produtos');
    setMobileNavOpen(false);
  }

  return (
    <>
      <div className="info-bar">
        <span>🚚 Frete combinado direto com você pelo WhatsApp</span>
        <span>✂️ Arte revisada antes de imprimir</span>
        <span>💬 Atendimento rápido</span>
      </div>
      {promocao && (
        <div className="promo-banner">
          🎉 <b>{promocao.nome}</b> — {promocao.percentual}% OFF em toda a loja
        </div>
      )}
      <header className="site">
        <div className="shell nav">
          <Link className="brand" to="/" onClick={() => onGoPage('inicio')}>
            <Logo size={40} />
            <span className="word">
              Bella <span>Arte</span>
              <small style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--graphite-faint)' }}>
                Gráfica &amp; Personalizados
              </small>
            </span>
          </Link>
          <form className="search-box header-search" onSubmit={buscar}>
            <SearchIcon />
            <input type="text" placeholder="Buscar canecas, adesivos, cartões e mais..." value={busca} onChange={e => setBusca(e.target.value)} />
          </form>
          <div className="nav-right">
            <button className="hamburger-btn" title="Menu" onClick={() => setMobileNavOpen(o => !o)}>{mobileNavOpen ? '✕' : '☰'}</button>
            <button className="cart-pill" title="Enviar minha arte" onClick={() => setUploadOpen(true)}>📎</button>
            <button className="cart-pill" title="Carrinho" onClick={onOpenCart}>🛍️ <b>{cart.length}</b></button>
            {user?.role === 'admin' && (
              <Link className="cart-pill" to="/admin" title="Voltar pro painel administrativo">⚙️ Painel admin</Link>
            )}
            {user ? (
              <button className="cart-pill" title="Sair da conta" onClick={() => { logout(); toast('Você saiu da sua conta.'); }}>
                <UserIcon /> {user.nome.split(' ')[0]}
              </button>
            ) : (
              <button className="cart-pill" title="Entrar / criar conta" onClick={() => setLoginOpen(true)}>
                <UserIcon /> Entrar
              </button>
            )}
          </div>
        </div>
        <nav className="cat-nav-row">
          {categorias.map(cat => (
            <a key={cat} className={categoriaAtiva === cat ? 'active' : ''} onClick={() => irParaCategoria(cat)}>{cat}</a>
          ))}
        </nav>
        <nav className={`mobile-nav shell ${mobileNavOpen ? 'open' : ''}`}>
          <form className="search-box header-search-mobile" onSubmit={buscar}>
            <SearchIcon />
            <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
          </form>
          <a className={page === 'inicio' ? 'active' : ''} onClick={() => { onGoPage('inicio'); navigate('/'); setMobileNavOpen(false); }}>Início</a>
          <a className={location.pathname === '/produtos' && !categoriaAtiva ? 'active' : ''} onClick={() => irParaCategoria(null)}>Todos os produtos</a>
          {categorias.map(cat => (
            <a key={cat} className={categoriaAtiva === cat ? 'active' : ''} onClick={() => irParaCategoria(cat)}>{cat}</a>
          ))}
        </nav>
      </header>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
    </>
  );
}
