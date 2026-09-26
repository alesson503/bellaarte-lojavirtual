export interface ArteAnexo { nome: string; tipo: string; dataUrl: string }

export interface CartItem {
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  arte?: { frente?: ArteAnexo; verso?: ArteAnexo };
  imagem?: string;
  // Ligação com o produto do ERP — só pro ERP achar o custo quando o
  // pedido for enviado pra lá (o cliente nunca vê isso).
  erpId?: string;
  erpNome?: string;
  m2?: number;
}
