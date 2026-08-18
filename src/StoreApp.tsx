import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import AdesivoConfigurator from './components/AdesivoConfigurator';
import CartaoConfigurator from './components/CartaoConfigurator';
import Catalogo from './components/Catalogo';
import CartModal from './components/CartModal';
import CheckoutModal from './components/CheckoutModal';
import UploadModal from './components/UploadModal';
import LoginModal from './components/LoginModal';
import Logo from './components/Logo';
import Toast from './components/Toast';
import { WhatsAppIcon, UserIcon } from './icons';
import { useAuth } from './auth/AuthContext';
import { useSiteSettings } from './context/SiteSettingsContext';
import { getConfig } from './services/configService';
import { WHATSAPP_NUMERO_PADRAO, whatsappLink } from './config';
import type { CartItem } from './types';
import heroCanecas from './assets/hero-canecas.jpg';

export type { CartItem };
export type Page = 'inicio' | 'categorias' | 'como' | 'personalize' | 'produtos' | 'contato';

const NAV_ITEMS: { page: Page; label: string }[] = [
  { page: 'inicio', label: 'Início' },
  { page: 'categorias', label: 'Categorias' },
  { page: 'produtos', label: 'Produtos' },
  { page: 'personalize', label: 'Personalize' },
  { page: 'como', label: 'Como funciona' },
  { page: 'contato', label: 'Contato' },
];

export default function StoreApp() {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const [whatsapp, setWhatsapp] = useState(WHATSAPP_NUMERO_PADRAO);
  useEffect(() => {
    getConfig().then(c => { if (c.whatsapp_numero) setWhatsapp(c.whatsapp_numero); }).catch(() => { /* mantém o padrão */ });
  }, []);
  const [page, setPage] = useState<Page>('inicio');
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [produtosFiltro, setProdutosFiltro] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adesivosRef = useRef<HTMLElement>(null);
  const cartoesRef = useRef<HTMLElement>(null);

  function toast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2600);
  }

  function goPage(next: Page, scrollToId?: string) {
    setPage(next);
    setScrollTarget(scrollToId ?? null);
  }

  function goProdutos(categoria: string) {
    setProdutosFiltro(categoria);
    goPage('produtos');
  }

  useEffect(() => {
    if (scrollTarget === 'adesivos') adesivosRef.current?.scrollIntoView({ behavior: 'smooth' });
    else if (scrollTarget === 'cartoes') cartoesRef.current?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [page, scrollTarget]);

  function addToCart(nome: string, preco: number) {
    setCart(prev => [...prev, { nome, preco }]);
    toast(`✓ ${nome} adicionado — ${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <>
      <header className="site">
        <div className="shell nav">
          <button className="brand" onClick={() => goPage('inicio')}>
            <Logo size={40} />
            <span className="word">Bella <span>Arte</span></span>
          </button>
          <nav className="links">
            {NAV_ITEMS.map(item => (
              <a key={item.page} className={page === item.page ? 'active' : ''} onClick={() => goPage(item.page)}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="nav-right">
            <button className="cart-pill" title="Enviar minha arte" onClick={() => setUploadOpen(true)}>📎</button>
            <button className="cart-pill" title="Carrinho" onClick={() => setCartOpen(true)}>🛍️ <b>{cart.length}</b></button>
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
      </header>

      {page === 'inicio' && (
        <div className="shell hero">
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="dot" />{settings.heroEyebrow}</div>
              <h1 className="serif">{settings.heroTitleLine1} <em>{settings.heroTitleEm}</em><br />{settings.heroTitleLine2}</h1>
              <p className="lede">{settings.heroLede}</p>
              <div className="hero-ctas">
                <button className="btn-primary" onClick={() => goPage('personalize', 'adesivos')}>Montar meu adesivo</button>
                <button className="btn-ghost" onClick={() => goPage('personalize', 'cartoes')}>Ver cartões de visita →</button>
              </div>
              <div className="hero-trust">
                <div><b>60</b><span>produtos cadastrados</span></div>
                <div><b>48h</b><span>produção média</span></div>
                <div><b>100%</b><span>arte revisada com você</span></div>
              </div>
            </div>
            <div className="peel-stage">
              <div className="hero-photo">
                <img src={settings.heroPhotoUrl || heroCanecas} alt="Canecas personalizadas Bella Arte, branca e rosa, com a logo BA" />
              </div>
              <div className="stage-tag">🏷️</div>
              <div className="float-chip c1">✂️ Recorte sob medida</div>
              <div className="float-chip c2">🎨 Sua arte, seu jeito</div>
            </div>
          </div>
        </div>
      )}

      {page === 'categorias' && (
        <section>
          <div className="shell">
            <div className="section-head">
              <div className="kicker">Categorias</div>
              <h2 className="serif">O que a gente faz por aqui</h2>
              <p>Do cartão que vai na carteira ao adesivo que vai na garrafinha — clique numa categoria pra ir direto pra ela no catálogo.</p>
            </div>
            <div className="rail">
              <button className="cat-card tone-a" onClick={() => goPage('personalize', 'adesivos')}>
                <div className="ic">🏷️</div>
                <b>Adesivos</b><span>UV e Vinil — recortado, refilado, laminado</span>
              </button>
              <button className="cat-card tone-b" onClick={() => goPage('personalize', 'cartoes')}>
                <div className="ic">🪪</div>
                <b>Cartões de Visita</b><span>100 a 1000 un, com ou sem verniz</span>
              </button>
              <button className="cat-card tone-c" onClick={() => goProdutos('Caneca')}>
                <div className="ic">☕</div>
                <b>Canecas</b><span>Branca, 180ml, alça colorida</span>
              </button>
              <button className="cat-card tone-a" onClick={() => goProdutos('Banner')}>
                <div className="ic">🚩</div>
                <b>Banners</b><span>Lona avulsa e Wind Banner (P/G/GG)</span>
              </button>
              <button className="cat-card tone-b" onClick={() => goProdutos('Outros')}>
                <div className="ic">✨</div>
                <b>Diversos</b><span>Panfletos, placas PS, polaroid e mais</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {page === 'como' && (
        <section className="band">
          <div className="shell">
            <div className="section-head" style={{ margin: '0 auto 34px', textAlign: 'center' }}>
              <div className="kicker">Como funciona</div>
              <h2 className="serif">É muito fácil pedir na Bella Arte</h2>
            </div>
            <div className="steps-grid">
              {[
                ['1', 'Escolha o produto', 'Navegue pelas categorias ou pelo catálogo completo e ache o que precisa.'],
                ['2', 'Personalize e envie sua arte', 'Escolha tamanho, quantidade e acabamento — depois envie seu arquivo ou peça nossa ajuda.'],
                ['3', 'Finalize o pedido', 'Adicione ao carrinho, confira tudo e finalize com seus dados de contato.'],
                ['4', 'Receba seus produtos', 'Produção rápida, com a qualidade e o cuidado de sempre.'],
              ].map(([num, title, desc]) => (
                <div className="step-card" key={num}>
                  <div className="step-num">{num}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {page === 'personalize' && (
        <>
          <AdesivoConfigurator onAdd={addToCart} sectionRef={adesivosRef} />
          <CartaoConfigurator onAdd={addToCart} sectionRef={cartoesRef} />
        </>
      )}

      {page === 'produtos' && (
        <Catalogo key={produtosFiltro} filtroInicial={produtosFiltro} onAdd={addToCart} onGoPersonalize={id => goPage('personalize', id)} />
      )}

      {page === 'contato' && (
        <div className="shell" style={{ paddingBottom: 20, paddingTop: 68 }}>
          <div className="final-cta">
            <div>
              <h2 className="serif">Não achou o que precisa?</h2>
              <p>Manda uma mensagem — a gente monta um orçamento sob medida em minutos.</p>
            </div>
            <a className="cta-whats" href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte e não achei o que eu precisava — pode me ajudar?')}
              target="_blank" rel="noopener noreferrer" style={{ background: 'var(--violet)' }}>
              <WhatsAppIcon /> Falar no WhatsApp
            </a>
          </div>
        </div>
      )}

      <footer className="site">
        <div className="shell foot-row">
          <span>🎨 Bella Arte — Gráfica &amp; Personalizados, São Paulo/SP</span>
        </div>
      </footer>

      <CartModal open={cartOpen} cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart}
        onCheckout={() => {
          if (!cart.length) { toast('Seu carrinho está vazio — adicione um produto primeiro.'); return; }
          setCartOpen(false);
          setCheckoutOpen(true);
        }} />
      <CheckoutModal open={checkoutOpen} cart={cart} onClose={() => setCheckoutOpen(false)} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={nome => { setLoginOpen(false); toast(`✓ Bem-vindo(a), ${nome.split(' ')[0]}!`); }} />
      <Toast message={toastMsg} show={toastShow} />
      <a className="whats-float" href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte.')}
        target="_blank" rel="noopener noreferrer" title="Falar no WhatsApp">
        <WhatsAppIcon size={28} />
      </a>
    </>
  );
}
