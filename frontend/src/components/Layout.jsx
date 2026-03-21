import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      <Sidebar />
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Topbar can go here if needed, for now just standard spacing */}
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Workspace</h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Role: {user.role}
            </span>
          </div>
        </header>
        <main className="p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
