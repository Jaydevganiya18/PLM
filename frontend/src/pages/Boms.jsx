import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Plus, Search, Archive, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const Boms = () => {
  const { user } = useAuth();
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ bom_code: '', product_id: '', components: [{ component_product_id: '', quantity: '', uom: 'pcs' }], operations: [{ operation_name: '', work_center: '', duration_minutes: '' }] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/boms').then(r => setBoms(r.data.data)),
      api.get('/products').then(r => setProducts(r.data.data.filter(p => p.status === 'ACTIVE'))),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = boms.filter(b =>
    b.bom_code.toLowerCase().includes(search.toLowerCase()) ||
    b.product?.product_code?.toLowerCase().includes(search.toLowerCase())
  );

  const addComponent = () => setForm(f => ({ ...f, components: [...f.components, { component_product_id: '', quantity: '', uom: 'pcs' }] }));
  const addOperation = () => setForm(f => ({ ...f, operations: [...f.operations, { operation_name: '', work_center: '', duration_minutes: '' }] }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/boms', form);
      setMsg('BoM created!');
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating BoM');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this BoM?')) return;
    try {
      await api.patch(`/boms/${id}/archive`);
      setMsg('BoM archived.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error archiving BoM');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bills of Materials</h1>
          <p className="text-gray-500 text-sm mt-1">Manage BoM definitions and component assignments</p>
        </div>
        {user.role === 'ADMIN' && (
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} /> New BoM
          </button>
        )}
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {showCreate && user.role === 'ADMIN' && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Create New BoM</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BoM Code</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.bom_code} onChange={e => setForm({...form, bom_code: e.target.value})} placeholder="BOM-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.product_code} - {p.current_version?.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Components</label>
                <button type="button" onClick={addComponent} className="text-blue-600 text-xs hover:underline">+ Add Row</button>
              </div>
              {form.components.map((c, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <select required className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={c.component_product_id} onChange={e => { const nc = [...form.components]; nc[i].component_product_id = e.target.value; setForm({...form, components: nc}); }}>
                    <option value="">Select Component</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.product_code} - {p.current_version?.name}</option>)}
                  </select>
                  <input required type="number" step="0.0001" placeholder="Qty" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={c.quantity} onChange={e => { const nc = [...form.components]; nc[i].quantity = e.target.value; setForm({...form, components: nc}); }} />
                  <input required placeholder="UOM (pcs, kg...)" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={c.uom} onChange={e => { const nc = [...form.components]; nc[i].uom = e.target.value; setForm({...form, components: nc}); }} />
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Operations</label>
                <button type="button" onClick={addOperation} className="text-blue-600 text-xs hover:underline">+ Add Row</button>
              </div>
              {form.operations.map((o, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                  <input required placeholder="Operation Name" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={o.operation_name} onChange={e => { const no = [...form.operations]; no[i].operation_name = e.target.value; setForm({...form, operations: no}); }} />
                  <input required placeholder="Work Center" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={o.work_center} onChange={e => { const no = [...form.operations]; no[i].work_center = e.target.value; setForm({...form, operations: no}); }} />
                  <input required type="number" step="0.01" placeholder="Duration (min)" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={o.duration_minutes} onChange={e => { const no = [...form.operations]; no[i].duration_minutes = e.target.value; setForm({...form, operations: no}); }} />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create BoM'}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Search BoMs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">BoM Code</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">No BoMs found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium">{b.bom_code}</td>
                    <td className="px-4 py-3 text-gray-600">{b.product?.product_code}</td>
                    <td className="px-4 py-3 text-gray-500">v{b.current_version?.version_no || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/boms/${b.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                          <Eye size={14} /> View
                        </Link>
                        {user.role === 'ADMIN' && b.status === 'ACTIVE' && (
                          <button onClick={() => handleArchive(b.id)} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-medium">
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

export default Boms;
