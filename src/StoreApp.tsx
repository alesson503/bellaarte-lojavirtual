import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import AdesivoConfigurator from './components/AdesivoConfigurator';
import CartaoConfigurator from './components/CartaoConfigurator';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import { CategoryIcon, SearchIcon, WhatsAppIcon } from './icons';
import { useSiteSettings } from './context/SiteSettingsContext';
import { useCart } from './context/CartContext';
import { useWhatsapp } from './context/WhatsappContext';
import { useProdutos } from './hooks/useProdutos';
import { whatsappLink } from './config';
import heroCanecas from './assets/hero-canecas.jpg';

export type Page = 'inicio' | 'como' | 'personalize' | 'contato';

export default function StoreApp() {
  const { settings } = useSiteSettings();
  const whatsapp = useWhatsapp();
  const { addToCart } = useCart();
  const { catalogo } = useProdutos();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState<Page>('inicio');
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  const categorias = useMemo(() => Array.from(new Set(catalogo.map(p => p.categoria))).sort(), [catalogo]);
  const maisPedidos = useMemo(() => catalogo.slice(0, 8), [catalogo]);

  const adesivosRef = useRef<HTMLElement>(null);
  const cartoesRef = useRef<HTMLElement>(null);

  function goPage(next: Page, scrollToId?: string) {
    setPage(next);
    setScrollTarget(scrollToId ?? null);
  }

  function goProdutos(categoria: string) {
    navigate(categoria === 'Todos' ? '/produtos' : `/produtos?categoria=${encodeURIComponent(categoria)}`);
  }

  // Outras páginas (Vitrine/Produto/Carrinho, e o próprio Footer) mandam pra
  // cá com { scrollTo: 'adesivos' | 'cartoes' } quando o clique era em algo
  // que só existe dentro da Home (configuradores), ou { page: 'como' | 'contato' }
  // pra abrir direto uma das seções-página. Depende de `location` (não só
  // do mount) pra funcionar mesmo clicando de novo já estando na Home.
  useEffect(() => {
    const state = location.state as { scrollTo?: string; page?: Page } | null;
    if (state?.scrollTo) {
      goPage('personalize', state.scrollTo);
      navigate('.', { replace: true, state: null });
    } else if (state?.page) {
      goPage(state.page);
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

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

          <div className="cats-title serif">O que você precisa hoje?</div>
          <div className="cats-row">
            {categorias.map(cat => (
              <button key={cat} className="cat-circle" onClick={() => goProdutos(cat)}>
                <div className="ic"><CategoryIcon categoria={cat} /></div>
                <b>{cat}</b>
              </button>
            ))}
            <button className="cat-circle" onClick={() => goProdutos('Todos')}>
              <div className="ic"><SearchIcon /></div>
              <b>Ver tudo</b>
            </button>
          </div>

          {maisPedidos.length > 0 && (
            <>
              <div className="section-title-row">
                <h2 className="serif">Mais pedidos</h2>
                <a onClick={() => goProdutos('Todos')}>Ver todos →</a>
              </div>
              <div className="gallery">
                {maisPedidos.map((p, i) => (
                  <ProductCard
                    key={('id' in p ? p.id : p.nome) + i}
                    produto={p}
                    onAdd={addToCart}
                    onGoPersonalize={id => goPage('personalize', id)}
                    onOpenDetalhe={produto => navigate(`/produto/${encodeURIComponent(produto.nome)}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
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
