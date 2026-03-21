import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Ecos = () => {
  const { user } = useAuth();
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/ecos').then(r => setEcos(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = ecos.filter(e => {
    const matchSearch = e.eco_number.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? e.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engineering Change Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all change requests and approvals</p>
        </div>
        {['ADMIN', 'ENGINEERING'].includes(user.role) && (
          <Link to="/ecos/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} /> New ECO
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Search ECOs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="REJECTED">REJECTED</option>
            <option value="APPLIED">APPLIED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {loading ? <div className="p-8 text-center text-gray-400">Loading ECOs...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ECO #</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested By</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="p-8 text-center text-gray-400">No ECOs found</td></tr>
                ) : filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-blue-700">{e.eco_number}</td>
                    <td className="px-4 py-3 max-w-48 truncate text-gray-800">{e.title}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.eco_type} /></td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">{e.product?.product_code}</td>
                    <td className="px-4 py-3 text-gray-600">{e.current_stage?.name || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{e.requester?.name}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/ecos/${e.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ecos;
