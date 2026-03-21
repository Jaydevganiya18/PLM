import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckCircle, AlertTriangle, Eye, ArrowRight, XCircle, X } from 'lucide-react';
import useEcoStore from '../store/ecoStore';
import useAuthStore from '../store/authStore';
import ECODetailModal from '../components/ECODetailModal';
import api from '../utils/api';

const CreateECOModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Product'); // 'Product' or 'BoM'
  const [targetId, setTargetId] = useState('');
  const [versionUpdate, setVersionUpdate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
  const [boms, setBoms] = useState([]);

  useEffect(() => {
    // Fetch options for Target dropdown
    const fetchTargets = async () => {
      try {
        const [prodRes, bomRes] = await Promise.all([
          api.get('/products'),
          api.get('/boms')
        ]);
        setProducts(prodRes.data);
        setBoms(bomRes.data);
      } catch (err) {
        console.error("Failed to fetch targets", err);
      }
    };
    fetchTargets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetId) return alert('Please select a target first.');
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        type,
        version_update: versionUpdate,
        proposed_changes: {}
      };

      if (type === 'Product') { 
        payload.product_id = targetId; 
        const p = products.find(prod => prod.id === Number(targetId));
        if (p) payload.proposed_changes = { name: p.name, sale_price: p.sale_price, cost_price: p.cost_price };
      } else { 
        payload.bom_id = targetId; 
        const b = boms.find(bm => bm.id === Number(targetId));
        if (b) payload.proposed_changes = { components: b.components, operations: b.operations };
      }
      
      const { data } = await api.post('/ecos', payload);
      onSuccess(data.eco || data);
      onClose();
    } catch (err) {
      alert("Failed to create ECO");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Engineering Change Order</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ECO Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Upgrade Table Legs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={type} 
                onChange={(e) => {
                  setType(e.target.value);
                  setTargetId('');
                }}
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Product">Product</option>
                <option value="BoM">Bill of Materials</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select 
                value={targetId} 
                onChange={(e) => setTargetId(e.target.value)}
                required
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="" disabled>Select target...</option>
                {type === 'Product' 
                  ? products.map(p => <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>)
                  : boms.map(b => <option key={b.id} value={b.id}>{b.product?.name || `BoM #${b.id}`} (v{b.version})</option>)
                }
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="version_update"
              checked={versionUpdate}
              onChange={(e) => setVersionUpdate(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="version_update" className="text-sm text-gray-700 cursor-pointer">
              Create new version on approval
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create ECO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ECOs = () => {
  const { ecos, fetchEcos, submitEcoOptimistic, addEco, loading } = useEcoStore();
  const { user } = useAuthStore();
  const [selectedEco, setSelectedEco] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEcos();
  }, [fetchEcos]);

  const handleAction = async (eco, e) => {
    e.stopPropagation();
    if (user?.role === 'Engineering' && eco.stage === 'New') {
      // Optimistic Submit logic (if Warning, handled inside modal, but simple submit here)
      // Usually warning check happens first. Let's redirect to modal viewing it for submission
      // But the spec says "Quick action button based on role: Engineering + New -> Submit"
      // "OPTIMISTIC UI RULE: When Engineering clicks Submit, IMMEDIATE move to Approval visually."
      try {
        await submitEcoOptimistic(eco.id, false);
      } catch (err) {
        // Handled in store with revert, perhaps show toast here
        alert("Failed to submit ECO");
      }
    }
  };

  const renderColumn = (title, stages, colorClass, borderColorClass) => {
    const columnEcos = ecos.filter(e => stages.includes(e.stage));
    
    return (
      <div className={`flex-1 flex flex-col rounded-xl border ${borderColorClass} bg-white bg-opacity-40 overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${borderColorClass} ${colorClass} flex justify-between items-center bg-opacity-20`}>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="bg-white rounded-full px-2.5 py-0.5 text-xs font-bold text-gray-600 shadow-sm border border-gray-100">
            {columnEcos.length}
          </span>
        </div>
        <div className="flex-1 p-3 flex flex-col gap-3 min-h-[500px] bg-gray-50/50">
          {columnEcos.map(eco => (
            <div 
              key={eco.id} 
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative"
              onClick={() => setSelectedEco(eco)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${eco.type === 'Product' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                  {eco.type}
                </span>
                {eco.version_update && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Creates New Version
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-3 line-clamp-2">
                {eco.title}
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{eco.type === 'BoM' ? eco.bom?.product_name || `BoM #${eco.bom_id}` : eco.product?.name || `Product #${eco.product_id}`}</span>
              </div>
              
              {eco.risk_acknowledged && (
                <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Risk Acknowledged
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                <div className="text-xs text-gray-500 flex flex-col">
                  <span>{eco.creator?.name || 'Unknown'}</span>
                  {/* <span>{new Date(eco.created_at).toLocaleDateString()}</span> */}
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="text-gray-600 hover:text-indigo-600 font-medium text-xs flex items-center gap-1 transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  
                  {user?.role === 'Engineering' && eco.stage === 'New' && (
                    <button 
                      onClick={(e) => handleAction(eco, e)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      Submit <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {user?.role === 'Approver' && eco.stage === 'Approval' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedEco(eco) }} // Just open modal for approver
                      className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                </div>
              </div>
              
              {eco.stage === 'Rejected' && (
                <div className="absolute top-2 right-2">
                 <XCircle className="w-5 h-5 text-red-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col max-w-[1400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Engineering Change Orders</h1>
          <p className="text-sm text-gray-500">{ecos.filter(e => e.stage !== 'Done' && e.stage !== 'Rejected').length} open ECOs</p>
        </div>
        {user?.role === 'Engineering' && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create ECO
          </button>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {renderColumn('New', ['New'], 'bg-blue-50 text-blue-800', 'border-blue-200')}
        {renderColumn('Approval', ['Approval'], 'bg-amber-50 text-amber-800', 'border-amber-200')}
        {renderColumn('Done', ['Done', 'Rejected'], 'bg-green-50 text-green-800', 'border-green-200')}
      </div>

      {selectedEco && (
        <ECODetailModal 
          eco={selectedEco} 
          onClose={() => setSelectedEco(null)} 
        />
      )}

      {showCreateModal && (
        <CreateECOModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newEco) => {
            addEco(newEco);
          }}
        />
      )}
    </div>
  );
};

export default ECOs;
