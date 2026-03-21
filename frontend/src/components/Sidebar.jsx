import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Layers, Settings, FileText, Activity, LogOut, ArrowLeftRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-4 text-xl font-bold border-b border-gray-800 flex items-center gap-2">
        <ArrowLeftRight className="text-blue-500" />
        PLM / ECO
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>

        <NavLink to="/products" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
          <Package size={20} /> Products Master
        </NavLink>

        <NavLink to="/boms" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
          <Layers size={20} /> Bills of Materials
        </NavLink>

        {user.role !== 'OPERATIONS' && (
          <NavLink to="/ecos" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <Activity size={20} /> Change Orders (ECO)
          </NavLink>
        )}

        {user.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</div>
            <NavLink to="/reports" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <FileText size={20} /> Reports
            </NavLink>
            <NavLink to="/audit-logs" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <Activity size={20} /> Audit Logs
            </NavLink>
            <NavLink to="/settings" className={({isActive}) => `flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
              <Settings size={20} /> Settings
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="mb-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors w-full p-2">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
