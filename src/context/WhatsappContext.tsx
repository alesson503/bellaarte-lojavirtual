import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConfig } from '../services/configService';
import { WHATSAPP_NUMERO_PADRAO } from '../config';

const WhatsappContext = createContext<string>(WHATSAPP_NUMERO_PADRAO);

export function WhatsappProvider({ children }: { children: ReactNode }) {
  const [whatsapp, setWhatsapp] = useState(WHATSAPP_NUMERO_PADRAO);
  useEffect(() => {
    getConfig().then(c => { if (c.whatsapp_numero) setWhatsapp(c.whatsapp_numero); }).catch(() => { /* mantém o padrão */ });
  }, []);

  return <WhatsappContext.Provider value={whatsapp}>{children}</WhatsappContext.Provider>;
}

export function useWhatsapp(): string {
  return useContext(WhatsappContext);
}
