import { useState } from 'react';
import { Link } from 'react-router-dom';
import UploadModal from './UploadModal';
import LoginModal from './LoginModal';
import Logo from './Logo';
import { UserIcon } from '../icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { usePromocao } from '../context/PromocaoContext';
import type { Page } from '../StoreApp';

const NAV_ITEMS: { page: Page; label: string }[] = [
  { page: 'inicio', label: 'Início' },
  { page: 'categorias', label: 'Categorias' },
  { page: 'produtos', label: 'Produtos' },
  { page: 'personalize', label: 'Personalize' },
  { page: 'como', label: 'Como funciona' },
  { page: 'contato', label: 'Contato' },
];

// Extraído de StoreApp.tsx — nav ainda navega via `page`/`onGoPage` (mesmo
// mecanismo de antes) porque /produtos e /carrinho ainda não existem como
// rotas de verdade; isso muda nas fases que criam essas páginas.
export default function Header({
  page,
  onGoPage,
  onOpenCart,
}: {
  page: Page;
  onGoPage: (next: Page, scrollToId?: string) => void;
  onOpenCart: () => void;
}) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { cart } = useCart();
  const { promocao } = usePromocao();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

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
          <button className="brand" onClick={() => go('inicio')}>
            <Logo size={40} />
            <span className="word">
              Bella <span>Arte</span>
              <small style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--graphite-faint)' }}>
                Gráfica &amp; Personalizados
              </small>
            </span>
          </button>
          <nav className="links">
            {NAV_ITEMS.map(item => (
              <a key={item.page} className={page === item.page ? 'active' : ''} onClick={() => go(item.page)}>
                {item.label}
              </a>
            ))}
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
          {NAV_ITEMS.map(item => (
            <a key={item.page} className={page === item.page ? 'active' : ''} onClick={() => go(item.page)}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
    </>
  );
}
