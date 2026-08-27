import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UploadModal from './UploadModal';
import LoginModal from './LoginModal';
import Logo from './Logo';
import { UserIcon } from '../icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { usePromocao } from '../context/PromocaoContext';
import type { Page } from '../StoreApp';

// Itens que ainda vivem dentro da Home como seção/âncora (StoreApp.tsx,
// enquanto a Fase 7 não transforma a Home numa rolagem contínua de verdade).
const HOME_NAV_ITEMS: { page: Page; label: string }[] = [
  { page: 'inicio', label: 'Início' },
  { page: 'categorias', label: 'Categorias' },
  { page: 'personalize', label: 'Personalize' },
  { page: 'como', label: 'Como funciona' },
  { page: 'contato', label: 'Contato' },
];

// Extraído de StoreApp.tsx. "Produtos" e o carrinho já são rotas de verdade
// (/produtos, /carrinho); os demais itens ainda navegam via `page`/
// `onGoPage` porque essas seções só existem dentro da Home por enquanto.
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const produtosAtivo = location.pathname === '/produtos';

  function go(next: Page, scrollToId?: string) {
    onGoPage(next, scrollToId);
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
          <Link className="brand" to="/">
            <Logo size={40} />
            <span className="word">
              Bella <span>Arte</span>
              <small style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--graphite-faint)' }}>
                Gráfica &amp; Personalizados
              </small>
            </span>
          </Link>
          <nav className="links">
            {HOME_NAV_ITEMS.map(item => (
              <a key={item.page} className={page === item.page ? 'active' : ''} onClick={() => go(item.page)}>
                {item.label}
              </a>
            ))}
            <Link className={produtosAtivo ? 'active' : ''} to="/produtos">Produtos</Link>
          </nav>
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
        <nav className={`mobile-nav shell ${mobileNavOpen ? 'open' : ''}`}>
          {HOME_NAV_ITEMS.map(item => (
            <a key={item.page} className={page === item.page ? 'active' : ''} onClick={() => go(item.page)}>
              {item.label}
            </a>
          ))}
          <Link className={produtosAtivo ? 'active' : ''} to="/produtos" onClick={() => setMobileNavOpen(false)}>Produtos</Link>
        </nav>
      </header>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
    </>
  );
}
