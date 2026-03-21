import React, { useEffect, useState } from 'react';
import { Package, List, Activity, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_ecos: 0,
    by_stage: { New: 0, Approval: 0, Done: 0, Rejected: 0 },
    by_type: { Product: 0, BoM: 0 }
  });
  const [matrix, setMatrix] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ecoRes, matrixRes, logsRes] = await Promise.all([
          api.get('/reports/eco-summary'),
          api.get('/reports/matrix'),
          api.get('/reports/audit-logs').catch(() => ({ data: [] }))
        ]);
        setStats(ecoRes.data);
        setMatrix(matrixRes.data);
        setRecentLogs(logsRes.data?.slice(0, 3) || []);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Active Products', value: matrix.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active BoMs', value: matrix.reduce((acc, p) => acc + (p.boms ? p.boms.length : 0), 0), icon: List, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Open ECOs', value: (stats.by_stage.New || 0) + (stats.by_stage.Approval || 0), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total ECOs', value: stats.total_ecos || 0, icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/products')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2">
            + Product
          </button>
          <button onClick={() => navigate('/ecos')} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors shadow-sm flex items-center gap-2">
            + ECO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 z-10">{loading ? '-' : card.value}</h3>
              {/* Decorative background element could go here */}
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {recentLogs.length > 0 ? recentLogs.map(log => (
            <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">{log.action}: {log.smart_summary || log.action}</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()} by {log.user?.name || 'System'}</p>
              </div>
            </div>
          )) : (
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-900 font-medium">Dashboard ready.</p>
                <p className="text-xs text-gray-500 mt-1">Activity logs will populate as actions occur.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
