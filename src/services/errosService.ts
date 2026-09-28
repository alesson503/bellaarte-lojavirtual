// Histórico de erros que travaram alguma tela da loja (pego pelo
// ErrorBoundary) — fica salvo no servidor pra dar pra investigar depois,
// mesmo que ninguém copie o erro na hora que ele aconteceu.
import { API_URL } from '../config';
import { authHeader } from '../auth/authService';

export interface ErroFrontend {
  id: number;
  mensagem: string;
  pilha: string | null;
  url: string | null;
  user_agent: string | null;
  criado_em: string;
}

// Melhor esforço: nunca lança erro (senão a tela de erro causaria outro erro).
export function reportarErro(mensagem: string, pilha: string, url: string) {
  try {
    fetch(`${API_URL}/api/erros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem, pilha, url }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* nunca deixa isso quebrar a tela de erro */ }
}

export async function listarErros(): Promise<ErroFrontend[]> {
  const res = await fetch(`${API_URL}/api/erros`, { headers: authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar o histórico de erros.');
  return data.erros;
}
