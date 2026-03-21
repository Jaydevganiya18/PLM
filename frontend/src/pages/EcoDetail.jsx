import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Play, CheckCircle, XCircle, ClipboardCheck, Save, Download } from 'lucide-react';

// Diff viewer for Product ECOs
const ProductDiff = ({ original, proposed }) => {
  if (!original || !proposed) return null;
  const fields = ['name', 'sale_price', 'cost_price'];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th className="px-4 py-2 text-left">Field</th>
            <th className="px-4 py-2 text-left">Original (v{original.version_no})</th>
            <th className="px-4 py-2 text-left">Proposed (new version)</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {fields.map(f => {
            const changed = String(original[f]) !== String(proposed[f]);
            return (
              <tr key={f} className={changed ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-2 font-medium capitalize">{f.replace('_', ' ')}</td>
                <td className={`px-4 py-2 ${changed ? 'text-red-600 line-through' : 'text-gray-700'}`}>{String(original[f])}</td>
                <td className={`px-4 py-2 ${changed ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>{String(proposed[f])}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Diff viewer for BOM ECOs
const BomDiff = ({ original, proposed }) => {
  if (!original || !proposed) return null;
  const origComps = original.components || [];
  const propComps = proposed.components || [];
  return (
    <div>
      <h3 className="font-semibold text-sm mb-2 text-gray-700">Component Changes</h3>
      <table className="w-full text-sm mb-4">
        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Line</th>
            <th className="px-3 py-2 text-left">Component ID</th>
            <th className="px-3 py-2 text-left">Orig Qty</th>
            <th className="px-3 py-2 text-left">Prop Qty</th>
            <th className="px-3 py-2 text-left">UOM</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {propComps.map((c, i) => {
            const orig = origComps[i];
            const qtyChanged = orig && String(orig.quantity) !== String(c.quantity);
            return (
              <tr key={i} className={qtyChanged || !orig ? 'bg-yellow-50' : ''}>
                <td className="px-3 py-2">{c.line_no || i + 1}</td>
                <td className="px-3 py-2 font-mono text-xs">{c.component_product_id}</td>
                <td className={`px-3 py-2 ${qtyChanged ? 'text-red-500 line-through' : ''}`}>{orig?.quantity || '-'}</td>
                <td className={`px-3 py-2 ${qtyChanged ? 'text-green-600 font-semibold' : ''}`}>{c.quantity}</td>
                <td className="px-3 py-2">{c.uom}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ---------- Edit Proposed Changes Form ----------
const EditProposedForm = ({ eco, onSaved }) => {
  const [form, setForm] = useState(() => {
    // Prefill with proposed_changes if exists, else use original_snapshot
    const base = eco.proposed_changes || eco.original_snapshot || {};
    if (eco.eco_type === 'PRODUCT') {
      return { name: base.name || '', sale_price: base.sale_price || '', cost_price: base.cost_price || '' };
    } else {
      return {
        components: (base.components || []).map(c => ({
          component_product_id: c.component_product_id,
          quantity: c.quantity,
          uom: c.uom
        })),
        operations: (base.operations || []).map(o => ({
          operation_name: o.operation_name,
          work_center: o.work_center,
          duration_minutes: o.duration_minutes
        }))
      };
    }
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await api.put(`/ecos/${eco.id}`, { proposed_changes: form });
      setMsg('Proposed changes saved!');
      onSaved();
    } catch (err) {
      setMsg('Error saving changes: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (eco.eco_type === 'PRODUCT') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-amber-800 mb-3">✏️ Edit Proposed Changes</h3>
        <p className="text-xs text-amber-700 mb-4">These values will be applied as the new product version when the ECO is approved.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Name</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Sale Price</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Cost Price</label>
            <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
          </div>
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>}
        <button onClick={handleSave} disabled={saving} className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm disabled:opacity-50">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Proposed Changes'}
        </button>
      </div>
    );
  }

  // BOM type
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
      <h3 className="font-semibold text-amber-800 mb-3">✏️ Edit Proposed Components</h3>
      <p className="text-xs text-amber-700 mb-4">Edit quantities / operations. These will create a new BoM version when ECO is applied.</p>
      <table className="w-full text-sm mb-4">
        <thead className="bg-gray-100 text-xs uppercase text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Component ID</th>
            <th className="px-3 py-2 text-left">Quantity</th>
            <th className="px-3 py-2 text-left">UOM</th>
          </tr>
        </thead>
        <tbody>
          {form.components.map((c, i) => (
            <tr key={i}>
              <td className="px-3 py-1 font-mono text-xs text-gray-500">{c.component_product_id}</td>
              <td className="px-3 py-1">
                <input type="number" step="0.0001" className="w-32 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={c.quantity} onChange={e => {
                  const nc = [...form.components]; nc[i] = { ...nc[i], quantity: e.target.value };
                  setForm({ ...form, components: nc });
                }} />
              </td>
              <td className="px-3 py-1">
                <input className="w-20 border border-gray-300 rounded px-2 py-1 text-sm" value={c.uom} onChange={e => {
                  const nc = [...form.components]; nc[i] = { ...nc[i], uom: e.target.value };
                  setForm({ ...form, components: nc });
                }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {msg && <p className={`mt-3 text-sm ${msg.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>{msg}</p>}
      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm disabled:opacity-50">
        <Save size={14} /> {saving ? 'Saving...' : 'Save Proposed Changes'}
      </button>
    </div>
  );
};

// =============================================
const EcoDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [eco, setEco] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('details');

  const reload = () => {
    api.get(`/ecos/${id}`).then(r => setEco(r.data.data));
  };

  useEffect(() => { reload(); }, [id]);

  const doAction = async (action, data = {}) => {
    setError('');
    setActionMsg('');
    try {
      await api.post(`/ecos/${id}/${action}`, data);
      setActionMsg(`Action "${action}" was successful!`);
      reload();
    } catch (err) {
      setError(err.response?.data?.message || `Error performing action: ${action}`);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pdf/eco/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ECO-${eco.eco_number}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate PDF');
    }
  };

  if (!eco || !user) return <div className="p-8 text-center text-gray-400">Loading ECO details...</div>;

  const isAdmin = user.role === 'ADMIN';
  const isEng = user.role === 'ENGINEERING';
  const isApprover = user.role === 'APPROVER';
  const isDraft = eco.status === 'DRAFT';
  const isRejected = eco.status === 'REJECTED';
  const isInProgress = eco.status === 'IN_PROGRESS';
  const isEditable = (isDraft || isRejected) && (isAdmin || isEng);
  
  // A stage allows Approval/Reject IF approval_required is true
  // OR IF the user is an ADMIN (Admins can override/validate any step)
  const stageApprovalRequired = eco.current_stage?.approval_required;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/ecos" className="p-2 rounded-lg border hover:bg-gray-50"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{eco.eco_number}</h1>
            <StatusBadge status={eco.status} />
            <StatusBadge status={eco.eco_type} />
          </div>
          <p className="text-gray-500 text-sm mt-1">{eco.title}</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm transition-colors"
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      {actionMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{actionMsg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Proposed Changes Editor - only in DRAFT/REJECTED mode */}
      {isEditable && (
        <EditProposedForm eco={eco} onSaved={reload} />
      )}

      {/* Workflow Action Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ClipboardCheck size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Current Stage</p>
              <p className="font-bold text-gray-900">{eco.current_stage?.name || 'Initialization'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase">Required Action</p>
            <p className="font-medium text-gray-700">
              {stageApprovalRequired ? 'Multi-party Approval' : 'Stage Validation'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* START Action */}
          {(isDraft || isRejected) && (isAdmin || isEng) && (
            <button onClick={() => doAction('start')} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md">
              <Play size={16} /> Start Workflow
            </button>
          )}

          {/* VALIDATE Action */}
          {isInProgress && !stageApprovalRequired && (isAdmin || isApprover || isEng) && (
            <button onClick={() => doAction('validate')} className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md">
              <ClipboardCheck size={16} /> Validate & Continue
            </button>
          )}

          {/* APPROVE/REJECT Actions */}
          {isInProgress && stageApprovalRequired && (isAdmin || isApprover) && (
            <div className="flex gap-2">
              <button onClick={() => doAction('approve', { comment: 'Approved' })} className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md">
                <CheckCircle size={16} /> Approve Changes
              </button>
              <button onClick={() => setShowReject(true)} className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all shadow-sm hover:shadow-md">
                <XCircle size={16} /> Reject ECO
              </button>
            </div>
          )}

          {!isEditable && !isInProgress && (
            <div className="flex items-center gap-2 text-gray-400 italic text-sm py-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              This ECO has been completed or cancelled. No further actions required.
            </div>
          )}
        </div>
      </div>

      {showReject && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 mb-2">Enter rejection reason:</p>
          <textarea className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { doAction('reject', { reason: rejectReason }); setShowReject(false); }} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Confirm Reject</button>
            <button onClick={() => setShowReject(false)} className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b">
        {['details', 'diff', 'history', 'approvals'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Product</p>
              <p className="font-mono mt-1">{eco.product?.product_code}</p>
            </div>
            {eco.bom && <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">BoM</p>
              <p className="font-mono mt-1">{eco.bom?.bom_code}</p>
            </div>}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Current Stage</p>
              <p className="mt-1">{eco.current_stage?.name || 'Not started'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Requested By</p>
              <p className="mt-1">{eco.requester?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Version Update</p>
              <p className="mt-1">{eco.version_update ? '✅ New version on apply' : '⚠️ Same version update'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Effective Date</p>
              <p className="mt-1">{eco.effective_date ? new Date(eco.effective_date).toLocaleDateString() : '-'}</p>
            </div>
            {eco.rejection_reason && (
              <div className="col-span-2">
                <p className="text-xs font-semibold text-red-500 uppercase">Rejection Reason</p>
                <p className="mt-1 text-red-600">{eco.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'diff' && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Change Comparison</h2>
            <p className="text-xs text-gray-400 mt-1">Original snapshot vs proposed changes (highlighted = changed)</p>
          </div>
          <div className="p-4">
            {eco.eco_type === 'PRODUCT' ? (
              <ProductDiff original={eco.original_snapshot} proposed={eco.proposed_changes} />
            ) : (
              <BomDiff original={eco.original_snapshot} proposed={eco.proposed_changes} />
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold">Stage History</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">From</th>
                <th className="px-4 py-3 text-left">To</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">By</th>
                <th className="px-4 py-3 text-left">Comment</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eco.stage_history?.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{h.from_stage?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{h.to_stage?.name || '-'}</td>
                  <td className="px-4 py-3 font-medium"><StatusBadge status={h.action} /></td>
                  <td className="px-4 py-3">{h.actor?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{h.comment || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(h.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'approvals' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-semibold">Approval Records</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Approver</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Comment</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eco.approvals?.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No approvals yet</td></tr>
              ) : eco.approvals?.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{a.stage?.name}</td>
                  <td className="px-4 py-3">{a.approver?.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.action} /></td>
                  <td className="px-4 py-3 text-gray-500">{a.comment || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EcoDetail;
