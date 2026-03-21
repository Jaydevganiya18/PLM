import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Archive, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ product_code: '', name: '', sale_price: '', cost_price: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/products').then(r => setProducts(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    p.product_code.toLowerCase().includes(search.toLowerCase()) ||
    (p.current_version?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/products', form);
      setMsg('Product created!');
      setShowCreate(false);
      setForm({ product_code: '', name: '', sale_price: '', cost_price: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating product');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this product?')) return;
    try {
      await api.patch(`/products/${id}/archive`);
      setMsg('Product archived.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error archiving product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Master</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product master data and version history</p>
        </div>
        {user.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} /> New Product
          </button>
        )}
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {showCreate && user.role === 'ADMIN' && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Product</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
              <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.product_code} onChange={e => setForm({...form, product_code: e.target.value})} placeholder="PROD-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Product Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
              <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.sale_price} onChange={e => setForm({...form, sale_price: e.target.value})} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
              <input required type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} placeholder="0.00" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Product'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Search by code or name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading products...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Product Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-right">Sale Price</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No products found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{p.product_code}</td>
                    <td className="px-4 py-3 text-gray-700">{p.current_version?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">v{p.current_version?.version_no || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-700">${Number(p.current_version?.sale_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">${Number(p.current_version?.cost_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/products/${p.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                          <Eye size={14} /> View
                        </Link>
                        {user.role === 'ADMIN' && p.status === 'ACTIVE' && (
                          <button onClick={() => handleArchive(p.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium">
                            <Archive size={14} /> Archive
                          </button>
                        )}
                      </div>
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

export default Products;
