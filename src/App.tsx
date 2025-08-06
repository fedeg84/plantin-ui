import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductTypesPage from './pages/ProductTypesPage';
import ProductTypeDetailPage from './pages/ProductTypeDetailPage';
import ProductTypeFormPage from './pages/ProductTypeFormPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/product-types" element={<ProductTypesPage />} />
        <Route path="/product-types/create" element={<ProductTypeFormPage />} />
        <Route path="/product-types/:id" element={<ProductTypeDetailPage />} />
        <Route path="/product-types/:id/edit" element={<ProductTypeFormPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/payment-methods" element={<PaymentMethodsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App; 