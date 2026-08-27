import { Outlet } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { WhatsappProvider } from '../context/WhatsappContext';
import { CartProvider } from '../context/CartContext';
import WhatsFloat from './WhatsFloat';

// Mesmo padrão de AdminLayout.tsx: layout compartilhado por todas as rotas
// da loja (hoje só "/", depois /produtos, /produto/:id, /carrinho também
// entram aqui), com os contexts da loja escopados só a essas rotas — o
// admin não é afetado.
export default function StoreLayout() {
  return (
    <ToastProvider>
      <WhatsappProvider>
        <CartProvider>
          <Outlet />
          <WhatsFloat />
        </CartProvider>
      </WhatsappProvider>
    </ToastProvider>
  );
}
