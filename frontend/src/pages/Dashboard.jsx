import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Package, Layers, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className={`block bg-white rounded-xl shadow-sm border-l-4 ${color} p-5 hover:shadow-md transition-shadow`}>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-gray-50">
        <Icon size={24} className="text-gray-600" />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value ?? '-'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [ecos, setEcos] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches = [
      api.get('/products').then(r => setProducts(r.data.data)),
      api.get('/boms').then(r => setBoms(r.data.data)),
    ];
    if (user.role !== 'OPERATIONS') {
      fetches.push(api.get('/ecos').then(r => setEcos(r.data.data)));
    }
    if (user.role === 'ADMIN') {
      fetches.push(api.get('/audit-logs').then(r => setRecentAudits(r.data.data.slice(0, 5))));
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [user.role]);

  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const activeBoms = boms.filter(b => b.status === 'ACTIVE').length;
  const draftEcos = ecos.filter(e => e.status === 'DRAFT').length;
  const pendingEcos = ecos.filter(e => e.status === 'IN_PROGRESS').length;
  const appliedEcos = ecos.filter(e => e.status === 'APPLIED').length;

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold">{user.name}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Package} label="Active Products" value={activeProducts} color="border-blue-500" to="/products" />
        <StatCard icon={Layers} label="Active BoMs" value={activeBoms} color="border-cyan-500" to="/boms" />
        {user.role !== 'OPERATIONS' && (
          <>
            <StatCard icon={Clock} label="Draft ECOs" value={draftEcos} color="border-yellow-500" to="/ecos" />
            <StatCard icon={AlertCircle} label="Pending Approval" value={pendingEcos} color="border-orange-500" to="/ecos" />
            <StatCard icon={CheckCircle} label="Applied ECOs" value={appliedEcos} color="border-green-500" to="/ecos" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user.role !== 'OPERATIONS' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Recent ECOs</h2>
              <Link to="/ecos" className="text-blue-600 text-sm hover:underline">View all</Link>
            </div>
            <div className="p-4">
              {ecos.slice(0, 5).length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No ECOs yet</p>
              ) : (
                <div className="space-y-3">
                  {ecos.slice(0, 5).map(eco => (
                    <Link to={`/ecos/${eco.id}`} key={eco.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{eco.eco_number}</p>
                        <p className="text-xs text-gray-500 truncate max-w-48">{eco.title}</p>
                      </div>
                      <StatusBadge status={eco.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {user.role === 'ADMIN' && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Recent Audit Logs</h2>
              <Link to="/audit-logs" className="text-blue-600 text-sm hover:underline">View all</Link>
            </div>
            <div className="p-4">
              {recentAudits.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No audit logs</p>
              ) : (
                <div className="space-y-2">
                  {recentAudits.map(log => (
                    <div key={log.id} className="p-3 rounded-lg border border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{log.action}</p>
                      <p className="text-xs text-gray-500">{log.smart_summary}</p>
                      <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
