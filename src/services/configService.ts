import { API_URL } from '../config';
import { authHeader } from '../auth/authService';

export async function getConfig(): Promise<Record<string, string>> {
  const res = await fetch(`${API_URL}/api/configuracoes`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar configurações.');
  return data.config;
}

export async function setConfig(chave: string, valor: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/configuracoes/${encodeURIComponent(chave)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ valor }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao salvar configuração.');
}
