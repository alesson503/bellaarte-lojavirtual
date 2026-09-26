import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as svc from '../services/siteSettingsService';
import type { SiteSettings } from '../services/siteSettingsService';

interface SiteSettingsContextValue {
  settings: SiteSettings;
  update: (patch: Partial<SiteSettings>) => void;
  reset: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => svc.getSettings());

  // As cores viram variáveis CSS no <html>, sobrepondo o tema padrão (claro e escuro).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--violet', settings.colorPrimary);
    root.style.setProperty('--violet-deep', settings.colorPrimaryDeep);
    root.style.setProperty('--blush-deep', settings.colorAccent);
  }, [settings.colorPrimary, settings.colorPrimaryDeep, settings.colorAccent]);

  // Fundo do site: se o admin subiu uma imagem própria, sobrepõe a padrão
  // (public/fundo.png, usada via var() com fallback no CSS).
  useEffect(() => {
    const root = document.documentElement;
    if (settings.fundoUrl) root.style.setProperty('--fundo-url', `url("${settings.fundoUrl}")`);
    else root.style.removeProperty('--fundo-url');
  }, [settings.fundoUrl]);

  function update(patch: Partial<SiteSettings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      svc.saveSettings(next);
      return next;
    });
  }

  function reset() {
    svc.resetSettings();
    setSettings(svc.DEFAULT_SETTINGS);
    const root = document.documentElement;
    root.style.removeProperty('--violet');
    root.style.removeProperty('--violet-deep');
    root.style.removeProperty('--blush-deep');
    root.style.removeProperty('--fundo-url');
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings precisa estar dentro de <SiteSettingsProvider>');
  return ctx;
}
