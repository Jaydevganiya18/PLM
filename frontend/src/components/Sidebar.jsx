import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, List, RefreshCw, BarChart2, LogOut, Settings } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
  const { user, logout } = useAuthStore();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/bom', label: 'Bills of Materials', icon: List },
    { to: '/ecos', label: 'ECOs', icon: RefreshCw },
    { to: '/reports', label: 'Reports', icon: BarChart2 },
  ];

  return (
    <div className="w-64 h-screen bg-[#111827] text-gray-300 flex flex-col flex-shrink-0 relative">
      <div className="flex items-center gap-3 p-5 text-white font-semibold text-xl tracking-tight border-b border-gray-800">
        <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        LogixWaveAI PLM
      </div>

      <div className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Navigation
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900/40 text-indigo-400 border-l-4 border-indigo-500'
                    : 'hover:bg-gray-800 hover:text-white border-l-4 border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-800 bg-gray-900 absolute bottom-0 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-400 truncate">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
