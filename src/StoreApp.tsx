import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import AdesivoConfigurator from './components/AdesivoConfigurator';
import CartaoConfigurator from './components/CartaoConfigurator';
import Header from './components/Header';
import Footer from './components/Footer';
import { WhatsAppIcon } from './icons';
import { useSiteSettings } from './context/SiteSettingsContext';
import { useCart } from './context/CartContext';
import { useWhatsapp } from './context/WhatsappContext';
import { whatsappLink } from './config';
import heroCanecas from './assets/hero-canecas.jpg';

export type Page = 'inicio' | 'categorias' | 'como' | 'personalize' | 'contato';

export default function StoreApp() {
  const { settings } = useSiteSettings();
  const whatsapp = useWhatsapp();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState<Page>('inicio');
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const adesivosRef = useRef<HTMLElement>(null);
  const cartoesRef = useRef<HTMLElement>(null);

  function goPage(next: Page, scrollToId?: string) {
    setPage(next);
    setScrollTarget(scrollToId ?? null);
  }

  function goProdutos(categoria: string) {
    navigate(categoria === 'Todos' ? '/produtos' : `/produtos?categoria=${encodeURIComponent(categoria)}`);
  }

  // Outras páginas (Vitrine/Produto) mandam pra cá com { scrollTo: 'adesivos' | 'cartoes' }
  // quando o clique era em algo que só existe dentro da Home (configuradores).
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      goPage('personalize', state.scrollTo);
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollTarget === 'adesivos') adesivosRef.current?.scrollIntoView({ behavior: 'smooth' });
    else if (scrollTarget === 'cartoes') cartoesRef.current?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [page, scrollTarget]);

  return (
    <>
      <Header page={page} onGoPage={goPage} onOpenCart={() => navigate('/carrinho')} />

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

      {page === 'inicio' && (
        <div className="shell">
          <div className="trust-badges">
            <div><span className="ic">🔒</span>Compra segura</div>
            <div><span className="ic">🎨</span>Arte revisada</div>
            <div><span className="ic">⚡</span>Produção em 48h</div>
            <div><span className="ic">💬</span>Atendimento direto</div>
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
            <div className="rail-wrap">
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

      <Footer />
    </>
  );
}
