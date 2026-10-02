// Vocabulário de status do pedido — mesmo valor salvo em pedidos.status,
// usado tanto no admin (pra mudar) quanto na tela do cliente (pra mostrar).
// 'em_producao' é ligado sozinho quando o pedido é enviado pro ERP (ver
// server/pedidosErp.js); os outros dois, por enquanto, são manuais no admin
// — no futuro "pronto"/"entregue" podem vir sozinhos da sincronização com o
// status da venda lá no ERP.
export const STATUS_PEDIDO = ['novo', 'em_producao', 'pronto', 'entregue'] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const STATUS_LABEL: Record<string, string> = {
  novo: 'Recebemos seu pedido',
  em_producao: 'Em produção',
  pronto: 'Pronto pra retirar/entrega',
  entregue: 'Entregue',
};

export const STATUS_COR: Record<string, string> = {
  novo: 'bg-cream-200 text-ink-soft',
  em_producao: 'bg-amber-100 text-amber-700',
  pronto: 'bg-rose-50 text-rose',
  entregue: 'bg-green-100 text-green-700',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}
