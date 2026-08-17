import { useRef, useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { imageToDataUrl } from '../lib/imageToDataUrl';
import logoDefault from '../assets/logo.png';
import heroDefault from '../assets/hero-canecas.jpg';

export default function AdminSiteSettings() {
  const { settings, update, reset } = useSiteSettings();
  const [erro, setErro] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  async function onLogoFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      const dataUrl = await imageToDataUrl(file, 320, 'image/png');
      update({ logoUrl: dataUrl });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  async function onHeroFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      const dataUrl = await imageToDataUrl(file, 1000, 'image/jpeg', 0.85);
      update({ heroPhotoUrl: dataUrl });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível usar essa imagem.');
    }
  }

  return (
    <>
      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Configurações do site</h2>
        <p className="sub">
          Essas mudanças aparecem na loja na hora — mas ficam salvas só neste navegador (é um editor de teste,
          local, até a loja ser integrada de verdade). Se abrir a loja em outro computador, não vai ver a mudança lá.
        </p>
      </div>

      {erro && <div className="adm-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Textos da home</h2>
        <p className="sub">O texto de destaque que aparece assim que alguém abre a loja.</p>
        <div className="field-group"><label>Selo (acima do título)</label><input value={settings.heroEyebrow} onChange={e => update({ heroEyebrow: e.target.value })} /></div>
        <div className="field-group"><label>Título — 1ª linha</label><input value={settings.heroTitleLine1} onChange={e => update({ heroTitleLine1: e.target.value })} /></div>
        <div className="field-group"><label>Título — palavra em destaque</label><input value={settings.heroTitleEm} onChange={e => update({ heroTitleEm: e.target.value })} /></div>
        <div className="field-group"><label>Título — 2ª linha</label><input value={settings.heroTitleLine2} onChange={e => update({ heroTitleLine2: e.target.value })} /></div>
        <div className="field-group"><label>Parágrafo</label><textarea rows={3} value={settings.heroLede} onChange={e => update({ heroLede: e.target.value })} /></div>
      </div>

      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Cores da marca</h2>
        <p className="sub">Usadas em botões, links ativos e destaques no site inteiro (loja e admin).</p>
        <div className="adm-color-row">
          <div className="adm-color-field">
            <input type="color" value={settings.colorPrimary} onChange={e => update({ colorPrimary: e.target.value })} />
            <div><b>Cor principal</b><span>Botões e links ativos</span></div>
          </div>
          <div className="adm-color-field">
            <input type="color" value={settings.colorPrimaryDeep} onChange={e => update({ colorPrimaryDeep: e.target.value })} />
            <div><b>Cor principal (hover)</b><span>Quando passa o mouse</span></div>
          </div>
          <div className="adm-color-field">
            <input type="color" value={settings.colorAccent} onChange={e => update({ colorAccent: e.target.value })} />
            <div><b>Cor de destaque</b><span>Selos e categorias</span></div>
          </div>
        </div>
      </div>

      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Logo</h2>
        <p className="sub">Aparece no cabeçalho da loja e nas telas do admin.</p>
        <div className="adm-upload-row">
          <img className="adm-preview-logo" src={settings.logoUrl || logoDefault} alt="Logo atual" />
          <div>
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => onLogoFile(e.target.files?.[0] ?? null)} />
            <button className="btn-outline-full" onClick={() => logoInputRef.current?.click()}>Trocar logo</button>
            {settings.logoUrl && <button className="adm-link-btn" onClick={() => update({ logoUrl: null })}>Usar logo padrão</button>}
          </div>
        </div>
      </div>

      <div className="adm-panel" style={{ marginBottom: 20 }}>
        <h2>Foto do banner (início)</h2>
        <p className="sub">A foto grande que aparece do lado do texto de destaque na home.</p>
        <div className="adm-upload-row">
          <img className="adm-preview-banner" src={settings.heroPhotoUrl || heroDefault} alt="Banner atual" />
          <div>
            <input ref={heroInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => onHeroFile(e.target.files?.[0] ?? null)} />
            <button className="btn-outline-full" onClick={() => heroInputRef.current?.click()}>Trocar foto</button>
            {settings.heroPhotoUrl && <button className="adm-link-btn" onClick={() => update({ heroPhotoUrl: null })}>Usar foto padrão</button>}
          </div>
        </div>
      </div>

      <button className="adm-logout-btn" onClick={() => { if (confirm('Restaurar todos os textos, cores e imagens pro padrão original?')) reset(); }}>
        Restaurar tudo pro padrão
      </button>
    </>
  );
}
