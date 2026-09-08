import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getConfig } from '../services/configService';

// Texto de reserva enquanto a configuração (editável em /admin/configuracoes,
// guardada no banco) ainda não carregou, ou pra quando o admin ainda não
// escreveu o texto de verdade — parágrafos separados por linha em branco.
export const SOBRE_NOS_PADRAO =
  `A Bella Arte nasceu da vontade de transformar ideias em algo que dá pra segurar na mão — de um cartão de visita que causa boa impressão a uma caneca que vira presente de verdade. Cada pedido passa por gente de verdade, que confere os detalhes antes de mandar pra produção.

Trabalhamos com adesivos, cartões de visita, canecas, banners e muito mais, sempre buscando o equilíbrio entre preço justo, qualidade de impressão e um atendimento que resolve rápido — direto pelo WhatsApp, sem enrolação.`;

const SobreNosContext = createContext<string>(SOBRE_NOS_PADRAO);

export function SobreNosProvider({ children }: { children: ReactNode }) {
  const [texto, setTexto] = useState(SOBRE_NOS_PADRAO);
  useEffect(() => {
    getConfig().then(c => { if (c.sobre_nos_texto) setTexto(c.sobre_nos_texto); }).catch(() => { /* mantém o padrão */ });
  }, []);

  return <SobreNosContext.Provider value={texto}>{children}</SobreNosContext.Provider>;
}

export function useSobreNos(): string {
  return useContext(SobreNosContext);
}
