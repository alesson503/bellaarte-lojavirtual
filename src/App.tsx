import { Navigate, Route, Routes } from 'react-router-dom';
import StoreApp from './StoreApp';
import StoreLayout from './components/StoreLayout';
import Vitrine from './pages/Vitrine';
import Produto from './pages/Produto';
import Carrinho from './pages/Carrinho';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminProducts from './admin/AdminProducts';
import AdminPromotions from './admin/AdminPromotions';
import AdminSiteSettings from './admin/AdminSiteSettings';

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route path="/" element={<StoreApp />} />
        <Route path="/produtos" element={<Vitrine />} />
        <Route path="/produto/:id" element={<Produto />} />
        <Route path="/carrinho" element={<Carrinho />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="produtos" element={<AdminProducts />} />
        <Route path="promocoes" element={<AdminPromotions />} />
        <Route path="configuracoes" element={<AdminSiteSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
