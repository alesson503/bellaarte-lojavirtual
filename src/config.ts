// Endereço do backend da loja (Postgres + API no Railway, separado do ERP).
export const API_URL = 'https://api-production-a2e7.up.railway.app';

// WhatsApp real da Bella Arte — valor de reserva enquanto a configuração
// (editável em /admin/configuracoes, guardada no banco) ainda não carregou.
// Formato: DDI 55 + DDD + número, sem espaços/símbolos (o que o link wa.me exige).
export const WHATSAPP_NUMERO_PADRAO = '5511948991616';

export function whatsappLink(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
