import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import useAuthStore from './store/authStore';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import BoM from './pages/BoM';

// Lazy load or import directly. Placeholder components to be added
import ECOs from './pages/ECOs';
import Reports from './pages/Reports';

// Lazy load or import directly. Placeholder components to be added


const App = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/bom" element={<BoM />} />
          <Route path="/ecos" element={<ECOs />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;