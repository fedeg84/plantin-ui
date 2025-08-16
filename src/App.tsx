import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import ProductTypesPage from './pages/ProductTypesPage';
import ProductTypeDetailPage from './pages/ProductTypeDetailPage';
import ProductTypeFormPage from './pages/ProductTypeFormPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import EditProductPage from './pages/EditProductPage';
import CreateProductPage from './pages/CreateProductPage';
import SalesPage from './pages/SalesPage';
import CreateSalePage from './pages/CreateSalePage';
import SaleDetailPage from './pages/SaleDetailPage';
import EditSalePage from './pages/EditSalePage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import UsersPage from './pages/UsersPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import UserDetailPage from './pages/UserDetailPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/sales/create" replace />} />
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={
          isAdmin() ? <AdminDashboardPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/users" element={
          isAdmin() ? <UsersPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/users/create" element={
          isAdmin() ? <CreateUserPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/users/:id" element={
          isAdmin() ? <UserDetailPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/users/:id/edit" element={
          isAdmin() ? <EditUserPage /> : <Navigate to="/sales/create" replace />
        } />

        <Route path="/product-types" element={<ProductTypesPage />} />
        <Route path="/product-types/create" element={<ProductTypeFormPage />} />
        <Route path="/product-types/:id" element={<ProductTypeDetailPage />} />
        <Route path="/product-types/:id/edit" element={<ProductTypeFormPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<EditProductPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/create" element={<CreateSalePage />} />
        <Route path="/sales/:id" element={<SaleDetailPage />} />
        <Route path="/sales/:id/edit" element={<EditSalePage />} />
        <Route path="/payment-methods" element={<PaymentMethodsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/sales/create" replace />} />
      </Routes>
    </Layout>
  );
}

export default App; 