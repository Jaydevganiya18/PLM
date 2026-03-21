import React, { useState, useEffect } from 'react';
import { List, Plus, Eye, X } from 'lucide-react';
import api from '../utils/api';

const CreateBoMModal = ({ onClose, onSuccess }) => {
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [components, setComponents] = useState([{ name: '', qty: 1, unit_cost: 0 }]);
  const [operations, setOperations] = useState([{ name: '', time: 0, work_center: '' }]);

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  }, []);

  const handleAddComponent = () => {
    setComponents([...components, { name: '', qty: 1, unit_cost: 0 }]);
  };

  const handleAddOperation = () => {
    setOperations([...operations, { name: '', time: 0, work_center: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId) return alert("Select a product");
    setLoading(true);
    try {
      const { data } = await api.post('/boms', { 
        product_id: Number(productId), 
        components: components.filter(c => c.name.trim() !== ''), 
        operations: operations.filter(o => o.name.trim() !== '') 
      });
      const selectedProduct = products.find(p => p.id === Number(productId));
      onSuccess({ ...data, product: selectedProduct });
      onClose();
    } catch (err) {
      alert("Failed to create BoM: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Bill of Materials</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select 
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="" disabled>Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Components</label>
              <button type="button" onClick={handleAddComponent} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {components.map((comp, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Name" className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={comp.name} onChange={(e) => { const newC = [...components]; newC[idx].name = e.target.value; setComponents(newC); }} />
                  <input type="number" placeholder="Qty" className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={comp.qty} onChange={(e) => { const newC = [...components]; newC[idx].qty = Number(e.target.value); setComponents(newC); }} />
                  <input type="number" placeholder="Cost" className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={comp.unit_cost} onChange={(e) => { const newC = [...components]; newC[idx].unit_cost = Number(e.target.value); setComponents(newC); }} />
                  <button type="button" onClick={() => setComponents(components.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Operations</label>
              <button type="button" onClick={handleAddOperation} className="text-xs flex items-center gap-1 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="space-y-2">
              {operations.map((op, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input type="text" placeholder="Operation" className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={op.name} onChange={(e) => { const newO = [...operations]; newO[idx].name = e.target.value; setOperations(newO); }} />
                  <input type="number" placeholder="Time" className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={op.time} onChange={(e) => { const newO = [...operations]; newO[idx].time = Number(e.target.value); setOperations(newO); }} />
                  <input type="text" placeholder="Work Center" className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" value={op.work_center} onChange={(e) => { const newO = [...operations]; newO[idx].work_center = e.target.value; setOperations(newO); }} />
                  <button type="button" onClick={() => setOperations(operations.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500 p-1"><X className="w-4 h-4"/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create BoM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BoM = () => {
  const [boms, setBoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchBoms = async () => {
      try {
        const res = await api.get('/boms');
        setBoms(res.data);
      } catch (err) {
        console.error("BoM fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoms();
  }, []);

  const calculateTotalCost = (components) => {
    if (!components) return 0;
    const comps = typeof components === 'string' ? JSON.parse(components) : components;
    return comps.reduce((acc, c) => acc + (c.qty * c.unit_cost), 0).toFixed(2);
  };

  const getComponentCount = (components) => {
    if (!components) return 0;
    const comps = typeof components === 'string' ? JSON.parse(components) : components;
    return comps.length;
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bills of Materials</h1>
          <p className="text-sm text-gray-500">{boms.length} active BoMs</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add BoM
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">Loading BoMs...</td>
                </tr>
              ) : boms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-sm">No active BoMs found.</td>
                </tr>
              ) : (
                boms.map((bom) => (
                  <tr key={bom.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <List className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{bom.product?.name || `Product #${bom.product_id}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{getComponentCount(bom.components)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">v{bom.version}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">${calculateTotalCost(bom.components)}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-700 transition-colors">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateBoMModal 
          onClose={() => setShowModal(false)} 
          onSuccess={(newBoM) => setBoms([...boms, newBoM])} 
        />
      )}
    </div>
  );
};

export default BoM;
