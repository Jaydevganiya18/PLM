import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, History } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [versions, setVersions] = useState([]);
  const [tab, setTab] = useState('overview');
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data.data);
      if (r.data.data.current_version) {
        setEditData({
          name: r.data.data.current_version.name,
          sale_price: r.data.data.current_version.sale_price,
          cost_price: r.data.data.current_version.cost_price,
        });
      }
    });
    if (user.role !== 'OPERATIONS') {
      api.get(`/products/${id}/versions`).then(r => setVersions(r.data.data));
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/products/${id}`, editData);
      setMsg('Product updated!');
      api.get(`/products/${id}`).then(r => setProduct(r.data.data));
    } catch (err) {
      setMsg('Error updating product');
    } finally {
      setSaving(false);
    }
  };

  if (!product) return <div className="p-8 text-center text-gray-400">Loading product...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/products" className="p-2 rounded-lg border hover:bg-gray-50">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.current_version?.name}</h1>
          <p className="text-sm text-gray-500">Code: <span className="font-mono">{product.product_code}</span></p>
        </div>
        <StatusBadge status={product.status} />
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['overview', 'versions'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Product Code</label>
              <p className="font-mono text-gray-900">{product.product_code}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Version</label>
              <p className="text-gray-900">v{product.current_version?.version_no}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Name</label>
              {user.role === 'ADMIN' ? (
                <input className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} />
              ) : <p className="text-gray-900">{product.current_version?.name}</p>}
            </div>
            <div />
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Sale Price</label>
              {user.role === 'ADMIN' ? (
                <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editData.sale_price || ''} onChange={e => setEditData({...editData, sale_price: e.target.value})} />
              ) : <p className="text-gray-900">${Number(product.current_version?.sale_price || 0).toFixed(2)}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cost Price</label>
              {user.role === 'ADMIN' ? (
                <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editData.cost_price || ''} onChange={e => setEditData({...editData, cost_price: e.target.value})} />
              ) : <p className="text-gray-900">${Number(product.current_version?.cost_price || 0).toFixed(2)}</p>}
            </div>
          </div>
          {user.role === 'ADMIN' && (
            <div className="mt-6">
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'versions' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <History size={18} className="text-gray-600" />
            <h2 className="font-semibold">Version History</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-right">Sale Price</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created Via ECO</th>
                <th className="px-4 py-3 text-left">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versions.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">v{v.version_no}</td>
                  <td className="px-4 py-3">{v.name}</td>
                  <td className="px-4 py-3 text-right">${Number(v.sale_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${Number(v.cost_price).toFixed(2)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{v.created_via_eco?.eco_number || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(v.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
