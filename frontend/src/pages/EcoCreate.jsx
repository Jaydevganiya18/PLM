import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft } from 'lucide-react';

const EcoCreate = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);
  const [form, setForm] = useState({ eco_number: '', title: '', eco_type: 'PRODUCT', product_id: '', bom_id: '', version_update: true, effective_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data.data.filter(p => p.status === 'ACTIVE')));
    api.get('/boms').then(r => setBoms(r.data.data.filter(b => b.status === 'ACTIVE')));
  }, []);

  const filteredBoms = boms.filter(b => String(b.product_id) === String(form.product_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/ecos', form);
      navigate(`/ecos/${res.data.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating ECO');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/ecos" className="p-2 rounded-lg border hover:bg-gray-50"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New ECO</h1>
          <p className="text-gray-500 text-sm">Define the change order details and scope</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ECO Number</label>
              <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="ECO-2024-001" value={form.eco_number} onChange={e => setForm({...form, eco_number: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ECO Type</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.eco_type} onChange={e => setForm({...form, eco_type: e.target.value, bom_id: ''})}>
                <option value="PRODUCT">PRODUCT</option>
                <option value="BOM">BOM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Describe the change..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value, bom_id: ''})}>
              <option value="">Select Product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.product_code} - {p.current_version?.name}</option>)}
            </select>
          </div>

          {form.eco_type === 'BOM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Materials</label>
              <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.bom_id} onChange={e => setForm({...form, bom_id: e.target.value})}>
                <option value="">Select BoM</option>
                {filteredBoms.map(b => <option key={b.id} value={b.id}>{b.bom_code} (v{b.current_version?.version_no})</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date (Optional)</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer py-2">
                <input type="checkbox" checked={form.version_update} onChange={e => setForm({...form, version_update: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Create new version on apply</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Creating...' : 'Save as Draft'}
            </button>
            <Link to="/ecos" className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EcoCreate;
