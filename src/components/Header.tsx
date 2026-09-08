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
// (/produtos, /carrinho); "Início" volta pra Home. O menu principal é fixo
// (Início/Produtos/Contato) — chegou a ser por categoria dinâmica, mas com
// o catálogo puxando categoria direto do ERP (nomes variados, alguns só
// fazem sentido lá dentro) isso virou uma lista longa e confusa aqui em
// cima; escolher categoria já é papel da barra lateral em /produtos.
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
  function irParaPersonalizar() {
    onGoPage('personalize');
    navigate('/');
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
          <a className={page === 'inicio' ? 'active' : ''} onClick={irParaInicio}>Início</a>
          <a className={location.pathname === '/produtos' ? 'active' : ''} onClick={irParaProdutos}>Produtos</a>
          <a className={page === 'personalize' ? 'active' : ''} onClick={irParaPersonalizar}>Personalizar</a>
          <a className={page === 'sobre' ? 'active' : ''} onClick={irParaSobre}>Sobre Nós</a>
          <a className={page === 'contato' ? 'active' : ''} onClick={irParaContato}>Contato</a>
        </nav>
        <nav className={`mobile-nav shell ${mobileNavOpen ? 'open' : ''}`}>
          <form className="search-box header-search-mobile" onSubmit={buscar}>
            <SearchIcon />
            <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
          </form>
          <a className={page === 'inicio' ? 'active' : ''} onClick={irParaInicio}>Início</a>
          <a className={location.pathname === '/produtos' ? 'active' : ''} onClick={irParaProdutos}>Produtos</a>
          <a className={page === 'personalize' ? 'active' : ''} onClick={irParaPersonalizar}>Personalizar</a>
          <a className={page === 'sobre' ? 'active' : ''} onClick={irParaSobre}>Sobre Nós</a>
          <a className={page === 'contato' ? 'active' : ''} onClick={irParaContato}>Contato</a>
        </nav>
      </header>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
    </>
  );
}
