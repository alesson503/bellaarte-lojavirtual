import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import AdesivoConfigurator from './components/AdesivoConfigurator';
import CartaoConfigurator from './components/CartaoConfigurator';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import { WhatsAppIcon } from './icons';
import { useSiteSettings } from './context/SiteSettingsContext';
import { useCart } from './context/CartContext';
import { useWhatsapp } from './context/WhatsappContext';
import { useSobreNos } from './context/SobreNosContext';
import { useProdutos } from './hooks/useProdutos';
import { whatsappLink } from './config';
import heroCanecas from './assets/hero-canecas.jpg';

export type Page = 'inicio' | 'como' | 'sobre' | 'personalize' | 'contato';

// Emoji + subtítulo por categoria na Home — mesma ideia do protótipo
// `loja-virtual` (page.tsx), adaptado pras categorias reais daqui.
const CATEGORIA_INFO: Record<string, { emoji: string; sub: string }> = {
  Caneca: { emoji: '☕', sub: 'Personalizadas' },
  Adesivo: { emoji: '✨', sub: 'Estilo pra tudo' },
  'Cartão de Visita': { emoji: '💌', sub: 'Sua marca' },
  Banner: { emoji: '🚩', sub: 'Chame atenção' },
  Outros: { emoji: '🎁', sub: 'Diversos' },
};

export default function StoreApp() {
  const { settings } = useSiteSettings();
  const whatsapp = useWhatsapp();
  const sobreNosTexto = useSobreNos();
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

  // Carrossel do hero — foto real da loja (se o dono cadastrou uma em
  // /admin/aparência) primeiro, seguida das fotos de ambiente cadastradas
  // lá também (ou as 4 padrão, se o dono não subiu nenhuma). Roda sozinho
  // a cada 5s, com setas e bolinhas.
  const fotosHero = useMemo(
    () => [
      ...(settings.heroPhotoUrl ? [settings.heroPhotoUrl] : [heroCanecas]),
      ...(settings.carrosselFotos.length ? settings.carrosselFotos : ['/banner/hero-1.png', '/banner/hero-2.png', '/banner/hero-3.png', '/banner/hero-4.png']),
    ],
    [settings.heroPhotoUrl, settings.carrosselFotos],
  );
  const [heroSlide, setHeroSlide] = useState(0);
  const irParaSlide = useCallback((i: number) => setHeroSlide((i + fotosHero.length) % fotosHero.length), [fotosHero.length]);
  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % fotosHero.length), 5000);
    return () => clearInterval(t);
  }, [fotosHero.length]);

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
    <div className="flex min-h-screen flex-col">
      <Header page={page} onGoPage={goPage} onOpenCart={() => navigate('/carrinho')} />
      <main className="flex-1">
      {page === 'inicio' && (
        <>
          <section className="mx-auto max-w-6xl px-4 pt-6">
            <div className="relative h-[260px] overflow-hidden rounded-3xl border border-cream-200 shadow-sm sm:h-[340px] md:h-[440px]">
              <img
                src={fotosHero[heroSlide]}
                alt="Bella Arte"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to right, rgba(253,241,246,0.94), rgba(253,241,246,0.6) 42%, rgba(253,241,246,0.1) 66%, rgba(253,241,246,0) 80%)' }}
              />
              <div className="absolute inset-0 flex items-center px-6 md:px-12">
                <div className="max-w-md">
                  <span className="inline-block rounded-full bg-white/80 px-4 py-1 text-sm font-bold text-rose shadow-sm">{settings.heroEyebrow}</span>
                  <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink md:text-4xl">
                    {settings.heroTitleLine1} <span className="text-rose">{settings.heroTitleEm}</span> {settings.heroTitleLine2}
                  </h1>
                  <p className="mt-2 hidden max-w-sm text-sm text-ink-soft sm:block md:text-base">{settings.heroLede}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => navigate('/produtos')} className="rounded-full bg-rose px-6 py-2.5 font-bold text-white shadow-sm transition hover:brightness-95">
                      🛒 Ver produtos
                    </button>
                    <a href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte.')} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white bg-white/85 px-6 py-2.5 font-bold text-ink shadow-sm transition hover:bg-white">
                      💬 Falar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <button onClick={() => irParaSlide(heroSlide - 1)} aria-label="Anterior" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-ink shadow transition hover:bg-white">‹</button>
              <button onClick={() => irParaSlide(heroSlide + 1)} aria-label="Próximo" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-xl text-ink shadow transition hover:bg-white">›</button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {fotosHero.map((_, i) => (
                  <button
                    key={i} onClick={() => irParaSlide(i)} aria-label={`Slide ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${i === heroSlide ? 'w-6 bg-rose' : 'w-2.5 bg-white/90'}`}
                  />
                ))}
              </div>
            </div>

            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl border border-cream-200 bg-white/70 px-4 py-3 text-sm font-semibold text-ink-soft">
              <span>🔒 Compra segura</span>
              <span>🎨 Arte revisada</span>
              <span>⚡ Produção em 48h</span>
              <span>💬 Atendimento direto</span>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-10">
            <h2 className="mb-5 font-display text-xl font-bold">O que você precisa hoje?</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {categorias.map(cat => {
                const info = CATEGORIA_INFO[cat] ?? { emoji: '🎁', sub: cat };
                return (
                  <button
                    key={cat}
                    onClick={() => goProdutos(cat)}
                    className="group flex flex-col items-center gap-1 rounded-2xl border border-cream-200 bg-white p-4 text-center transition hover:-translate-y-1 hover:border-rose hover:shadow-md"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-2xl transition group-hover:bg-rose-light">{info.emoji}</span>
                    <span className="mt-1 font-display text-sm font-bold text-ink">{cat}</span>
                    <span className="text-xs text-ink-muted">{info.sub}</span>
                  </button>
                );
              })}
              <button
                onClick={() => goProdutos('Todos')}
                className="group flex flex-col items-center gap-1 rounded-2xl border border-cream-200 bg-white p-4 text-center transition hover:-translate-y-1 hover:border-rose hover:shadow-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-2xl transition group-hover:bg-rose-light">⭐</span>
                <span className="mt-1 font-display text-sm font-bold text-ink">Ver tudo</span>
                <span className="text-xs text-ink-muted">Toda a loja</span>
              </button>
            </div>
          </section>

          {maisPedidos.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 pb-0">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink md:text-3xl">🔥 Destaques da Loja</h2>
                  <p className="mt-1 text-ink-muted">Os produtos mais amados pelos nossos clientes 💖</p>
                </div>
                <button onClick={() => goProdutos('Todos')} className="hidden rounded-full border border-cream-200 bg-white px-5 py-2 text-sm font-bold text-rose hover:bg-cream-100 md:block">
                  Ver todos →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
                {maisPedidos.map((p, i) => (
                  <ProductCard
                    key={('id' in p ? p.id : p.nome) + i}
                    produto={p}
                    index={i}
                    onOpenDetalhe={produto => navigate(`/produto/${encodeURIComponent(produto.nome)}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {page === 'como' && (
        <section className="band pb-0">
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

      {page === 'sobre' && (
        <div className="shell" style={{ paddingTop: 68, paddingBottom: 0 }}>
          <div className="section-head" style={{ margin: '0 auto 8px', textAlign: 'center', maxWidth: 640 }}>
            <div className="kicker">Sobre nós</div>
            <h2 className="serif">A Bella Arte é feita de gente que gosta do que faz</h2>
          </div>
          {/* Texto editável em /admin/configuracoes (guardado no banco, vale
              pra loja inteira) — parágrafos separados por linha em branco. */}
          <div style={{ maxWidth: 640, margin: '28px auto 0', fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sobreNosTexto.split(/\n{2,}/).map((paragrafo, i) => <p key={i}>{paragrafo}</p>)}
          </div>
          <div className="hero-ctas" style={{ justifyContent: 'center', marginTop: 30 }}>
            <a className="cta-whats" href={whatsappLink(whatsapp, 'Olá! Vi a página Sobre Nós da Bella Arte e queria saber mais.')} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Falar no WhatsApp
            </a>
          </div>
        </div>
      )}

      {page === 'personalize' && (
        <>
          <AdesivoConfigurator onAdd={addToCart} sectionRef={adesivosRef} />
          <CartaoConfigurator onAdd={addToCart} sectionRef={cartoesRef} />
        </>
      )}

      {page === 'contato' && (
        // Full-bleed (sem shell/cantos arredondados) de propósito — encosta
        // direto no rodapé (mesmo bg-ink) e vira um bloco preto só, em vez
        // de parecer uma caixa flutuando separada em cima do rodapé.
        <div className="bg-ink px-4 pb-16 pt-24 text-cream-50">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <h2 className="font-display text-2xl font-extrabold md:text-3xl">Não achou o que precisa?</h2>
              <p className="mt-2 text-cream-200">Manda uma mensagem — a gente monta um orçamento sob medida em minutos.</p>
            </div>
            <a
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-rose px-6 py-3 font-bold text-white transition hover:brightness-95"
              href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte e não achei o que eu precisava — pode me ajudar?')}
              target="_blank" rel="noopener noreferrer"
            >
              <WhatsAppIcon /> Falar no WhatsApp
            </a>
          </div>
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}
