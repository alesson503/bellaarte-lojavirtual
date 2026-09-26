import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem } from '../types';
import { useToast } from './ToastContext';

export type ErpLink = Pick<CartItem, 'erpId' | 'erpNome' | 'm2'>;

interface CartContextValue {
  cart: CartItem[];
  addToCart: (nome: string, preco: number, quantidade?: number, observacao?: string, arte?: CartItem['arte'] | null, imagem?: string, erp?: ErpLink) => void;
  removeFromCart: (idx: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// Precisa montar por dentro de <ToastProvider> — usa o toast de sucesso ao
// adicionar, igual ao comportamento que já existia em StoreApp.tsx.
export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(nome: string, preco: number, quantidade = 1, observacao?: string, arte?: CartItem['arte'] | null, imagem?: string, erp?: ErpLink) {
    setCart(prev => [...prev, { nome, preco, quantidade, observacao: observacao?.trim() || undefined, arte: arte || undefined, imagem, ...erp }]);
    const totalItem = preco * quantidade;
    toast(`✓ ${nome}${quantidade > 1 ? ` ×${quantidade}` : ''} adicionado — ${totalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  }

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de <CartProvider>');
  return ctx;
}
