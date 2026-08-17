// Configurações visuais do site, editáveis pelo admin (/admin/configuracoes).
//
// Mesmo esquema local/mock do authService e ordersService: fica salvo no
// localStorage DESTE navegador. Isso significa que hoje é só pra você
// testar a tela — quando integrar com um sistema real, isso devia virar
// uma configuração salva no backend e servida pra todo mundo.

export interface SiteSettings {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleEm: string;
  heroTitleLine2: string;
  heroLede: string;
  logoUrl: string | null;
  heroPhotoUrl: string | null;
  colorPrimary: string;
  colorPrimaryDeep: string;
  colorAccent: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  heroEyebrow: 'Feito à mão, sob encomenda',
  heroTitleLine1: 'Sua marca,',
  heroTitleEm: 'impressa',
  heroTitleLine2: 'do jeito certo.',
  heroLede: 'Adesivos, cartões de visita, canecas e muito mais — 60 produtos já cadastrados, prontos pra você escolher o formato, a quantidade e ver o preço na hora.',
  logoUrl: null,
  heroPhotoUrl: null,
  colorPrimary: '#A63368',
  colorPrimaryDeep: '#7F2350',
  colorAccent: '#D6427F',
};

const KEY = 'bellaarte_site_settings';

export function getSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<SiteSettings> };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SiteSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function resetSettings() {
  localStorage.removeItem(KEY);
}
