import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as svc from '../services/siteSettingsService';
import type { SiteSettings } from '../services/siteSettingsService';

interface SiteSettingsContextValue {
  settings: SiteSettings;
  update: (patch: Partial<SiteSettings>) => void;
  reset: () => void;
  erroSalvar: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  // Começa com a cópia local (pinta rápido) e troca pela do servidor, que é
  // a que vale pra todo mundo.
  const [settings, setSettings] = useState<SiteSettings>(() => svc.getSettings());
  const [erroSalvar, setErroSalvar] = useState('');
  const salvarTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    svc.buscarAparenciaServidor()
      .then(s => { setSettings(s); svc.saveSettings(s); })
      .catch(() => { /* mantém a cópia local / padrão */ });
  }, []);

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

  // Só o painel admin daqui chama update/reset — salva no servidor um
  // instante depois da última mudança (não a cada tecla).
  function salvarNoServidor(next: SiteSettings) {
    window.clearTimeout(salvarTimer.current);
    salvarTimer.current = window.setTimeout(() => {
      svc.salvarAparenciaServidor(next)
        .then(() => setErroSalvar(''))
        .catch(e => setErroSalvar(e instanceof Error ? e.message : 'Erro ao salvar a aparência.'));
    }, 800);
  }

  function update(patch: Partial<SiteSettings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      svc.saveSettings(next);
      salvarNoServidor(next);
      return next;
    });
  }

  function reset() {
    svc.resetSettings();
    setSettings(svc.DEFAULT_SETTINGS);
    salvarNoServidor(svc.DEFAULT_SETTINGS);
    const root = document.documentElement;
    root.style.removeProperty('--violet');
    root.style.removeProperty('--violet-deep');
    root.style.removeProperty('--blush-deep');
    root.style.removeProperty('--fundo-url');
  }

  return (
    <SiteSettingsContext.Provider value={{ settings, update, reset, erroSalvar }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings precisa estar dentro de <SiteSettingsProvider>');
  return ctx;
}
