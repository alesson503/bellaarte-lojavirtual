import { useRef, useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { imageToDataUrl } from '../lib/imageToDataUrl';
import logoDefault from '../assets/logo.png';
import heroDefault from '../assets/hero-canecas.jpg';

// Reunido aqui (era espalhado em "Configurações"): tudo que muda o visual
// da loja — textos da home, cores, logo, foto do banner, fundo do site e
// as fotos que rodam no carrossel. Igual já era antes, essa parte fica
// salva só neste navegador (prévia de teste) — só WhatsApp, senha e
// "Sobre Nós" (na aba Configurações) valem pra loja inteira de verdade.
export default function AdminAparencia() {
  const { settings, update, reset } = useSiteSettings();
  const [erro, setErro] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const fundoInputRef = useRef<HTMLInputElement>(null);
  const carrosselInputRef = useRef<HTMLInputElement>(null);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      update({ logoUrl: await imageToDataUrl(file, 320, 'image/png') });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  async function onHeroFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      update({ heroPhotoUrl: await imageToDataUrl(file, 1000, 'image/jpeg', 0.85) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  async function onFundoFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      update({ fundoUrl: await imageToDataUrl(file, 1400, 'image/jpeg', 0.85) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  async function onCarrosselFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setErro('');
    try {
      const novas = await Promise.all(Array.from(files).map(f => imageToDataUrl(f, 1000, 'image/jpeg', 0.85)));
      update({ carrosselFotos: [...settings.carrosselFotos, ...novas] });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essas imagens.');
    }
  }

  function removerFotoCarrossel(i: number) {
    update({ carrosselFotos: settings.carrosselFotos.filter((_, idx) => idx !== i) });
  }

  return (
    <>
      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Aparência</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Textos, cores, logo e fotos da loja. Fica salvo só neste navegador (prévia de teste) — abrir a loja em
          outro computador não mostra essas mudanças lá.
        </p>
      </div>

      {erro && <p className="mb-5 rounded-2xl border border-rose bg-rose-50 p-4 text-sm font-semibold text-rose">{erro}</p>}

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Textos da home</h2>
        <p className="mt-1 text-sm text-ink-muted">O texto de destaque que aparece assim que alguém abre a loja.</p>
        <div className="mt-4 flex flex-col gap-3">
          <Campo label="Selo (acima do título)"><input className={inputCls} value={settings.heroEyebrow} onChange={e => update({ heroEyebrow: e.target.value })} /></Campo>
          <Campo label="Título — 1ª linha"><input className={inputCls} value={settings.heroTitleLine1} onChange={e => update({ heroTitleLine1: e.target.value })} /></Campo>
          <Campo label="Título — palavra em destaque"><input className={inputCls} value={settings.heroTitleEm} onChange={e => update({ heroTitleEm: e.target.value })} /></Campo>
          <Campo label="Título — 2ª linha"><input className={inputCls} value={settings.heroTitleLine2} onChange={e => update({ heroTitleLine2: e.target.value })} /></Campo>
          <Campo label="Parágrafo"><textarea rows={3} className={inputCls} value={settings.heroLede} onChange={e => update({ heroLede: e.target.value })} /></Campo>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Cores da marca</h2>
        <p className="mt-1 text-sm text-ink-muted">Usadas em botões, links ativos e destaques no site inteiro (loja e admin).</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CampoCor label="Cor principal" sub="Botões e links ativos" valor={settings.colorPrimary} onChange={v => update({ colorPrimary: v })} />
          <CampoCor label="Cor principal (hover)" sub="Quando passa o mouse" valor={settings.colorPrimaryDeep} onChange={v => update({ colorPrimaryDeep: v })} />
          <CampoCor label="Cor de destaque" sub="Selos e categorias" valor={settings.colorAccent} onChange={v => update({ colorAccent: v })} />
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Logo</h2>
        <p className="mt-1 text-sm text-ink-muted">Aparece no cabeçalho da loja e nas telas do admin.</p>
        <div className="mt-4 flex items-center gap-4">
          <img className="h-16 w-16 rounded-xl border border-cream-200 object-contain p-1" src={settings.logoUrl || logoDefault} alt="Logo atual" />
          <div className="flex flex-col items-start gap-1.5">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onLogoFile(e.target.files?.[0] ?? null)} />
            <button className="rounded-full border border-cream-200 px-4 py-2 text-sm font-bold text-ink hover:border-rose hover:text-rose" onClick={() => logoInputRef.current?.click()}>Trocar logo</button>
            {settings.logoUrl && <button className="text-sm font-semibold text-rose hover:underline" onClick={() => update({ logoUrl: null })}>Usar logo padrão</button>}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Foto do banner (início)</h2>
        <p className="mt-1 text-sm text-ink-muted">A foto grande que aparece no carrossel da home, junto com o texto de destaque.</p>
        <div className="mt-4 flex items-center gap-4">
          <img className="h-20 w-28 rounded-xl border border-cream-200 object-cover" src={settings.heroPhotoUrl || heroDefault} alt="Banner atual" />
          <div className="flex flex-col items-start gap-1.5">
            <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={e => onHeroFile(e.target.files?.[0] ?? null)} />
            <button className="rounded-full border border-cream-200 px-4 py-2 text-sm font-bold text-ink hover:border-rose hover:text-rose" onClick={() => heroInputRef.current?.click()}>Trocar foto</button>
            {settings.heroPhotoUrl && <button className="text-sm font-semibold text-rose hover:underline" onClick={() => update({ heroPhotoUrl: null })}>Usar foto padrão</button>}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Imagem de fundo</h2>
        <p className="mt-1 text-sm text-ink-muted">A textura que aparece atrás de tudo, na loja inteira.</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-20 w-20 rounded-xl border border-cream-200 bg-cover bg-center" style={{ backgroundImage: `url("${settings.fundoUrl || '/fundo.png'}")` }} />
          <div className="flex flex-col items-start gap-1.5">
            <input ref={fundoInputRef} type="file" accept="image/*" className="hidden" onChange={e => onFundoFile(e.target.files?.[0] ?? null)} />
            <button className="rounded-full border border-cream-200 px-4 py-2 text-sm font-bold text-ink hover:border-rose hover:text-rose" onClick={() => fundoInputRef.current?.click()}>Trocar fundo</button>
            {settings.fundoUrl && <button className="text-sm font-semibold text-rose hover:underline" onClick={() => update({ fundoUrl: null })}>Usar fundo padrão</button>}
          </div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cream-200 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-ink">Fotos do carrossel</h2>
        <p className="mt-1 text-sm text-ink-muted">Fotos extras que rodam no carrossel da home, além da foto do banner acima. Sem nenhuma, usa 4 fotos padrão.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {settings.carrosselFotos.map((foto, i) => (
            <div key={i} className="relative h-20 w-32 overflow-hidden rounded-xl border border-cream-200 bg-cover bg-center" style={{ backgroundImage: `url("${foto}")` }}>
              <button onClick={() => removerFotoCarrossel(i)} aria-label="Remover" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-xs shadow">✕</button>
            </div>
          ))}
          <label className="grid h-20 w-32 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-cream-200 text-center text-xs font-semibold text-ink-muted hover:border-rose hover:text-rose">
            + Adicionar foto
            <input ref={carrosselInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onCarrosselFiles(e.target.files)} />
          </label>
        </div>
        {settings.carrosselFotos.length > 0 && (
          <button className="mt-3 text-sm font-semibold text-ink-muted hover:text-rose hover:underline" onClick={() => update({ carrosselFotos: [] })}>Usar as 4 fotos padrão</button>
        )}
      </div>

      <button
        className="rounded-2xl border border-cream-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-muted hover:border-rose hover:text-rose"
        onClick={() => { if (confirm('Restaurar todos os textos, cores e imagens pro padrão original?')) reset(); }}
      >
        Restaurar tudo pro padrão
      </button>
    </>
  );
}

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-rose';

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

function CampoCor({ label, sub, valor, onChange }: { label: string; sub: string; valor: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-cream-200 p-3">
      <input type="color" value={valor} onChange={e => onChange(e.target.value)} className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-cream-200" />
      <div>
        <b className="block text-sm text-ink">{label}</b>
        <span className="text-xs text-ink-muted">{sub}</span>
      </div>
    </div>
  );
}
