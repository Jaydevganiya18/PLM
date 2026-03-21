import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useEcoStore from '../store/ecoStore';
import api from '../utils/api';

const ECODetailModal = ({ eco, onClose }) => {
  const { user } = useAuthStore();
  const { updateEco, submitEcoOptimistic } = useEcoStore();
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [aiWarningData, setAiWarningData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Parse JSON data safely
  const original = typeof eco.original_snapshot === 'string' ? JSON.parse(eco.original_snapshot) : eco.original_snapshot;
  const initialProposed = typeof eco.proposed_changes === 'string' ? JSON.parse(eco.proposed_changes) : eco.proposed_changes;
  const [editableProposed, setEditableProposed] = useState(initialProposed || {});

  const proposed = isEditing ? editableProposed : initialProposed;

  const handleSaveChanges = async () => {
    try {
      await api.patch(`/ecos/${eco.id}/changes`, { proposed_changes: editableProposed });
      updateEco({ ...eco, proposed_changes: JSON.stringify(editableProposed) });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save changes: ' + (err.response?.data?.error || err.message));
    }
  };

  // AI impact analysis mock fetch logic for BoM logic diff
  useEffect(() => {
    if (eco.type === 'BoM' && eco.stage === 'New') {
      const fetchAiImpact = async () => {
        try {
          // This calls the backend AI endpoint.
          // For now, if no backend is running, this might fail, so catch gracefully
          const res = await api.post('/ai/anomaly-detection', {
             old_bom: original,
             proposed_bom: proposed,
             eco_title: eco.title
          });
          if (res.data.has_warning) {
             setAiWarningData(res.data);
          }
        } catch (err) {
          console.error("AI Analysis error", err);
        }
      };
      // fetchAiImpact();
    }
  }, [eco, original, proposed]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/ecos/${eco.id}/approve`);
      updateEco(data.eco);
      onClose();
    } catch (err) {
      alert("Failed to approve");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) return alert("Reason must be at least 10 chars");
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/ecos/${eco.id}/reject`, { rejection_reason: rejectionReason });
      updateEco({ ...eco, stage: 'Rejected', rejection_reason: rejectionReason });
      onClose();
    } catch (err) {
      alert("Failed to reject");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // If we have AI warning and hasn't acknowledged yet
    // mock condition for demo
    const hasAiWarning = !!aiWarningData;
    if (hasAiWarning && !eco.risk_acknowledged) {
      setShowSoftWarning(true);
      return;
    }

    try {
      await submitEcoOptimistic(eco.id, false);
      onClose();
    } catch(err) {
      console.error(err);
    }
  };

  const handleRiskAcknowledge = async () => {
    try {
      await submitEcoOptimistic(eco.id, true);
      setShowSoftWarning(false);
      onClose();
    } catch(err) {
      console.error(err);
    }
  };

  const renderDiffTable = () => {
    if (eco.type === 'Product') {
      return (
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Current Version (v{original?.version || 1})</h3>
            <div className="space-y-4">
               <div><p className="text-xs text-gray-500">Name</p><p className="text-sm font-medium">{original?.name}</p></div>
               <div><p className="text-xs text-gray-500">Sale Price</p><p className="text-sm font-medium">${original?.sale_price}</p></div>
               <div><p className="text-xs text-gray-500">Cost Price</p><p className="text-sm font-medium">${original?.cost_price}</p></div>
            </div>
          </div>
          <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-indigo-700">Proposed Changes (v{(original?.version || 1) + 1})</h3>
              {eco.stage === 'New' && user?.role === 'Engineering' && !isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-xs text-indigo-600 hover:underline font-medium">Edit</button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <button onClick={() => { setIsEditing(false); setEditableProposed(initialProposed); }} className="text-xs text-gray-500 hover:underline">Cancel</button>
                  <button onClick={handleSaveChanges} className="text-xs text-green-600 hover:underline font-medium">Save</button>
                </div>
              )}
            </div>
            <div className="space-y-4">
                <div>
                 <p className="text-xs text-indigo-300">Name</p>
                 {isEditing ? (
                   <input type="text" value={editableProposed.name || ''} onChange={(e) => setEditableProposed({...editableProposed, name: e.target.value})} className="mt-1 block w-full text-sm border-indigo-300 rounded focus:ring-indigo-500 p-1 bg-white border" />
                 ) : (
                   <p className="text-sm font-medium">{proposed?.name || original?.name}</p>
                 )}
               </div>
               <div>
                 <p className="text-xs text-indigo-300">Sale Price</p>
                 {isEditing ? (
                   <input type="number" value={editableProposed.sale_price || ''} onChange={(e) => setEditableProposed({...editableProposed, sale_price: Number(e.target.value)})} className="mt-1 block w-full text-sm border-indigo-300 rounded focus:ring-indigo-500 p-1 bg-white border" />
                 ) : (
                   <p className={`text-sm font-medium inline-block px-2 rounded ${proposed?.sale_price !== original?.sale_price ? 'bg-green-100 text-green-700' : ''}`}>
                     ${proposed?.sale_price || original?.sale_price}
                   </p>
                 )}
               </div>
               <div>
                 <p className="text-xs text-indigo-300">Cost Price</p>
                 {isEditing ? (
                   <input type="number" value={editableProposed.cost_price || ''} onChange={(e) => setEditableProposed({...editableProposed, cost_price: Number(e.target.value)})} className="mt-1 block w-full text-sm border-indigo-300 rounded focus:ring-indigo-500 p-1 bg-white border" />
                 ) : (
                   <p className={`text-sm font-medium inline-block px-2 rounded ${proposed?.cost_price !== original?.cost_price ? 'bg-red-100 text-red-700' : ''}`}>
                     ${proposed?.cost_price || original?.cost_price}
                   </p>
                 )}
               </div>
            </div>
          </div>
        </div>
      );
    }

    // Return rendering for BoMs diff logic
    return (
      <div className="space-y-6">
        {/* Components Table Diff */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-3">Components Changes</h4>
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Current Version (v{original?.version || 1})</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                    <th className="px-4 py-2 font-medium">Component</th>
                    <th className="px-4 py-2 font-medium">Qty</th>
                    <th className="px-4 py-2 font-medium">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(original?.components || []).map((c, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{c.name}</td>
                      <td className="px-4 py-2">{c.qty}</td>
                      <td className="px-4 py-2">${c.unit_cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-indigo-200 rounded-lg overflow-hidden bg-white">
              <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-indigo-700">Proposed Changes (v{(original?.version || 1) + 1})</h3>
                {eco.stage === 'New' && user?.role === 'Engineering' && !isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs text-indigo-600 hover:underline font-medium">Edit</button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditing(false); setEditableProposed(initialProposed); }} className="text-xs text-gray-500 hover:underline">Cancel</button>
                    <button onClick={handleSaveChanges} className="text-xs text-green-600 hover:underline font-medium">Save</button>
                  </div>
                )}
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-indigo-50 border-b border-indigo-100 text-indigo-600">
                    <th className="px-4 py-2 font-medium">Component</th>
                    <th className="px-4 py-2 font-medium">Qty</th>
                    <th className="px-4 py-2 font-medium">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(proposed?.components || original?.components || []).map((c, i) => {
                     const old = original?.components?.find(oc => oc.name === c.name);
                     const isAdded = !old;
                     const isQtyChanged = old && old.qty !== c.qty;

                     return (
                      <tr key={i} className={isAdded ? 'bg-green-50 text-green-700 italic' : ''}>
                        <td className="px-4 py-2 font-medium">{c.name}</td>
                        <td className={`px-4 py-2 ${isQtyChanged ? (c.qty > old.qty ? 'bg-green-100 text-green-700 font-bold' : 'bg-red-100 text-red-700 font-bold') : ''}`}>
                           {isEditing ? (
                             <input type="number" 
                               value={c.qty} 
                               onChange={(e) => {
                                 const newComponents = [...editableProposed.components];
                                 newComponents[i].qty = Number(e.target.value);
                                 setEditableProposed({...editableProposed, components: newComponents});
                               }} 
                               className="w-16 p-1 border text-black text-xs rounded border-indigo-300 focus:ring-indigo-500 focus:outline-none" 
                             />
                           ) : c.qty}
                        </td>
                        <td className="px-4 py-2">${c.unit_cost}</td>
                      </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Impact metrics - mocked as part of requirement */}
        {eco.stage === 'New' && aiWarningData && (
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-6">
             <div className="flex-1">
               <h4 className="text-sm font-bold text-indigo-900 mb-2">AI Strategic Analysis</h4>
               <p className="text-sm text-indigo-800 leading-relaxed bg-white p-3 rounded-lg border border-indigo-100">
                 {aiWarningData.message}
               </p>
             </div>
             <div className="w-48 flex flex-col gap-3 justify-center border-l border-indigo-100 pl-6">
               <div className={`p-3 rounded-lg border ${aiWarningData.cost_pct < 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                 <p className="text-xs text-center font-semibold mb-1">Cost Impact</p>
                 <p className={`text-xl font-bold text-center ${aiWarningData.cost_pct < 0 ? 'text-green-700' : 'text-red-700'}`}>
                   {aiWarningData.cost_pct}%
                 </p>
                 {aiWarningData.cost_pct < 0 && <p className="text-[10px] text-center text-blue-600 mt-1">Value Engineering</p>}
               </div>
               <div className={`p-3 rounded-lg border ${aiWarningData.time_pct < 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                 <p className="text-xs text-center font-semibold mb-1">Time Impact</p>
                 <p className={`text-xl font-bold text-center ${aiWarningData.time_pct < 0 ? 'text-green-700' : 'text-amber-700'}`}>
                   +{aiWarningData.time_pct}%
                 </p>
               </div>
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                eco.stage === 'New' ? 'bg-blue-100 text-blue-800' :
                eco.stage === 'Approval' ? 'bg-amber-100 text-amber-800' :
                eco.stage === 'Done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {eco.stage}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                eco.type === 'Product' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {eco.type} ECO
              </span>
              <span className="text-gray-400 font-medium text-sm">#{eco.id}</span>
              {eco.version_update && (
                 <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm">
                   Version Update
                 </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 pr-10">{eco.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {eco.risk_acknowledged && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-800">Submitter Acknowledged Risk</h4>
                <p className="text-sm text-amber-700 mt-1">This ECO was submitted despite an AI-detected anomaly.</p>
              </div>
            </div>
          )}

          {eco.stage === 'Rejected' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="text-sm font-bold text-red-800 mb-1">Rejection Reason</h4>
              <p className="text-sm text-red-700">{eco.rejection_reason}</p>
            </div>
          )}

          {renderDiffTable()}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            Close
          </button>
          
          {user?.role === 'Engineering' && eco.stage === 'New' && (
            <button 
              onClick={handleSubmit} 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              Submit for Approval <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}

          {user?.role === 'Approver' && eco.stage === 'Approval' && (
            <>
              {!rejectMode ? (
                <>
                  <button onClick={() => setRejectMode(true)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
                    Reject
                  </button>
                  <button onClick={handleApprove} disabled={isSubmitting} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Approve & Apply
                  </button>
                </>
              ) : (
                <div className="flex-1 flex gap-3 items-center">
                  <input 
                    type="text" 
                    placeholder="Enter rejection reason (min 10 chars)..." 
                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <button onClick={() => setRejectMode(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
                  <button onClick={handleReject} disabled={isSubmitting || rejectionReason.length < 10} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                    Confirm Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showSoftWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-amber-900/60 backdrop-blur-sm">
          <div className="bg-[#fffdf0] border border-amber-200 rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-amber-50">
               <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">AI Risk Notice</h3>
            <p className="text-amber-800 text-sm mb-6 leading-relaxed">
              {aiWarningData?.message || "Quantity decreased but assembly time increased. If this is intentional, acknowledge below."}
            </p>
            <div className="flex justify-between items-center bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6 text-sm font-medium text-amber-800">
              <span className="flex flex-col">Cost Change: <strong className="text-green-600">-10%</strong></span>
              <span className="flex flex-col">Time Change: <strong className="text-red-600">+25%</strong></span>
            </div>
            <div className="flex flex-col gap-3">
               <button onClick={handleRiskAcknowledge} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition-colors">
                 Acknowledge Risk & Submit →
               </button>
               <button onClick={() => setShowSoftWarning(false)} className="w-full py-2.5 text-amber-700 font-medium hover:bg-amber-100 rounded-xl transition-colors">
                 ← Go Back & Revise
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ECODetailModal;
