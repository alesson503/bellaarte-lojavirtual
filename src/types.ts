export interface CartItem {
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  arte?: { nome: string; tipo: string; dataUrl: string };
}
