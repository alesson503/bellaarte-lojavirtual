export interface ArteAnexo { nome: string; tipo: string; dataUrl: string }

export interface CartItem {
  nome: string;
  preco: number;
  quantidade: number;
  observacao?: string;
  arte?: { frente?: ArteAnexo; verso?: ArteAnexo };
}
