import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, BellRing, User, TerminalSquare, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import socket from '../utils/socket';

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const routeNames = {
    '/': 'Dashboard',
    '/products': 'Products',
    '/bom': 'Bills of Materials',
    '/ecos': 'Engineering Change Orders',
    '/reports': 'Reports',
  };

  const title = routeNames[location.pathname] || 'LogixWaveAI PLM';
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleNotification = (event, data) => {
      const newNotif = {
        id: Date.now(),
        type: event, // 'eco_submitted', 'eco_approved', 'eco_rejected', 'eco_created'
        message: getMessageForEvent(event, data),
        read: false,
        time: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    };

    socket.on('eco_submitted', (data) => handleNotification('eco_submitted', data));
    socket.on('eco_approved', (data) => handleNotification('eco_approved', data));
    socket.on('eco_rejected', (data) => handleNotification('eco_rejected', data));
    socket.on('eco_created', (data) => handleNotification('eco_created', data));

    return () => {
      socket.off('eco_submitted');
      socket.off('eco_approved');
      socket.off('eco_rejected');
      socket.off('eco_created');
    };
  }, []);

  const getMessageForEvent = (event, data) => {
    switch(event) {
      case 'eco_submitted': return `ECO Submitted: ${data.title}`;
      case 'eco_approved': return `ECO Approved (v${data.new_version}) by ${data.approved_by}: ${data.eco_title}`;
      case 'eco_rejected': return `ECO Rejected: ${data.rejection_reason}`;
      case 'eco_created': return `New ECO Created: ${data.eco?.title}`;
      default: return 'New notification received';
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
    setShowDropdown(false);
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'eco_approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'eco_rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 text-gray-500">
        <TerminalSquare className="w-5 h-5" />
      </div>
      
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors"
          >
            {unreadCount > 0 ? (
              <>
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></div>
                <BellRing className="w-5 h-5 text-gray-700" />
              </>
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium hover:text-indigo-800">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3 ${!notif.read ? 'bg-indigo-50/30' : ''}`}>
                      <div className="mt-0.5">{getIconForType(notif.type)}</div>
                      <div>
                        <p className="text-sm text-gray-800">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notif.time.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge mini */}
        <div className="flex items-center gap-2 pl-6 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User className="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
