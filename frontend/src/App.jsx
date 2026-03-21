import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';

// Public Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Boms from './pages/Boms';
import BomDetail from './pages/BomDetail';
import Ecos from './pages/Ecos';
import EcoCreate from './pages/EcoCreate';
import EcoDetail from './pages/EcoDetail';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';

// Guard for admin-only routes
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

// Guard blocking operations from ECO access
const NoOpsRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'OPERATIONS') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />

            {/* BoMs */}
            <Route path="boms" element={<Boms />} />
            <Route path="boms/:id" element={<BomDetail />} />

            {/* ECOs - hidden from Operations */}
            <Route path="ecos" element={<NoOpsRoute><Ecos /></NoOpsRoute>} />
            <Route path="ecos/new" element={<NoOpsRoute><EcoCreate /></NoOpsRoute>} />
            <Route path="ecos/:id" element={<NoOpsRoute><EcoDetail /></NoOpsRoute>} />

            {/* Admin only */}
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
