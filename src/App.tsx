import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import ProductsSectionLayout from './pages/ProductsSectionLayout';
import ProductTypesPage from './pages/ProductTypesPage';
import ProductTypeFormPage from './pages/ProductTypeFormPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CreateProductPage from './pages/CreateProductPage';
import SalesPage from './pages/SalesPage';
import CreateSalePage from './pages/CreateSalePage';
import EditSalePage from './pages/EditSalePage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import UsersPage from './pages/UsersPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import ShiftsPage from './pages/ShiftsPage';
import ProfilePage from './pages/ProfilePage';
import PaymentsSectionLayout from './pages/PaymentsSectionLayout';
import ExpensesPage from './pages/ExpensesPage';
import CreateExpensePage from './pages/CreateExpensePage';
import EditExpensePage from './pages/EditExpensePage';
import ExpenseTypesPage from './pages/ExpenseTypesPage';

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
          isAdmin() ? <Navigate to="edit" replace /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/users/:id/edit" element={
          isAdmin() ? <EditUserPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/shifts" element={
          isAdmin() ? <ShiftsPage /> : <Navigate to="/sales/create" replace />
        } />

        <Route path="/admin/payments" element={
          isAdmin() ? <PaymentsSectionLayout /> : <Navigate to="/sales/create" replace />
        }>
          <Route index element={<ExpensesPage />} />
          <Route path="types" element={<ExpenseTypesPage />} />
        </Route>
        <Route path="/admin/expenses" element={<Navigate to="/admin/payments" replace />} />
        <Route path="/admin/expense-types" element={<Navigate to="/admin/payments/types" replace />} />
        <Route path="/admin/expenses/create" element={
          isAdmin() ? <CreateExpensePage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/expenses/:id" element={
          isAdmin() ? <Navigate to="edit" replace /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/expenses/:id/edit" element={
          isAdmin() ? <EditExpensePage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/expense-types/create" element={
          isAdmin() ? <Navigate to="/admin/payments/types" replace /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/expense-types/:id" element={
          isAdmin() ? <Navigate to="/admin/payments/types" replace /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/admin/expense-types/:id/edit" element={
          isAdmin() ? <Navigate to="/admin/payments/types" replace /> : <Navigate to="/sales/create" replace />
        } />

        <Route path="/products" element={<ProductsSectionLayout />}>
          <Route index element={<ProductsPage />} />
          <Route path="types" element={<ProductTypesPage />} />
        </Route>
        <Route path="/product-types" element={<Navigate to="/products/types" replace />} />
        <Route path="/product-types/create" element={<ProductTypeFormPage />} />
        <Route path="/product-types/:id" element={<Navigate to="edit" replace />} />
        <Route path="/product-types/:id/edit" element={<ProductTypeFormPage />} />
        <Route path="/products/create" element={<CreateProductPage />} />
        <Route path="/products/:id/edit" element={<Navigate to=".." replace />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/create" element={<CreateSalePage />} />
        <Route path="/sales/:id/edit" element={<EditSalePage />} />
        <Route path="/sales/:id" element={<Navigate to="edit" replace />} />
        <Route path="/payment-methods" element={
          isAdmin() ? <PaymentMethodsPage /> : <Navigate to="/sales/create" replace />
        } />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/sales/create" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
