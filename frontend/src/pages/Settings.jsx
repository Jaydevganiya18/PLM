import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { Plus } from 'lucide-react';

const Settings = () => {
  const [stages, setStages] = useState([]);
  const [rules, setRules] = useState([]);
  const [tab, setTab] = useState('stages');
  const [stageForm, setStageForm] = useState({ name: '', sequence_no: '', approval_required: false, is_start_stage: false, is_final_stage: false, is_active: true });
  const [ruleForm, setRuleForm] = useState({ stage_id: '', approver_role: 'APPROVER', min_approvals: 1, is_active: true });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get('/settings/eco-stages').then(r => setStages(r.data.data));
    api.get('/settings/approval-rules').then(r => setRules(r.data.data));
  };

  useEffect(() => { load(); }, []);

  const createStage = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/settings/eco-stages', stageForm);
      setMsg('Stage created!');
      setStageForm({ name: '', sequence_no: '', approval_required: false, is_start_stage: false, is_final_stage: false, is_active: true });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating stage');
    }
  };

  const createRule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/settings/approval-rules', ruleForm);
      setMsg('Approval rule created!');
      setRuleForm({ stage_id: '', approver_role: 'APPROVER', min_approvals: 1, is_active: true });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating rule');
    }
  };

  const toggleStage = async (stage) => {
    try {
      await api.put(`/settings/eco-stages/${stage.id}`, { ...stage, is_active: !stage.is_active });
      load();
    } catch (err) {
      setError('Error toggling stage');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure ECO stages and approval rules</p>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{msg}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-2 mb-6 border-b">
        {['stages', 'approval rules'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'stages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Create New Stage</h3>
            <form onSubmit={createStage} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
                <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={stageForm.name} onChange={e => setStageForm({...stageForm, name: e.target.value})} placeholder="e.g. Engineering Review" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sequence #</label>
                <input required type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={stageForm.sequence_no} onChange={e => setStageForm({...stageForm, sequence_no: parseInt(e.target.value)})} />
              </div>
              <div className="col-span-2 flex gap-6">
                {['approval_required', 'is_start_stage', 'is_final_stage', 'is_active'].map(k => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={!!stageForm[k]} onChange={e => setStageForm({...stageForm, [k]: e.target.checked})} className="rounded text-blue-600" />
                    {k.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 col-span-2 w-max">Create Stage</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b"><h3 className="font-semibold">Existing Stages</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Seq</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-center">Approval Req</th>
                  <th className="px-4 py-3 text-center">Start</th>
                  <th className="px-4 py-3 text-center">Final</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stages.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold">{s.sequence_no}</td>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-center">{s.approval_required ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-center">{s.is_start_stage ? '🟢' : '—'}</td>
                    <td className="px-4 py-3 text-center">{s.is_final_stage ? '🔴' : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.is_active ? 'ACTIVE' : 'ARCHIVED'} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStage(s)} className="text-xs text-blue-600 hover:underline">
                        {s.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'approval rules' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Plus size={16} /> Create Approval Rule</h3>
            <form onSubmit={createRule} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={ruleForm.stage_id} onChange={e => setRuleForm({...ruleForm, stage_id: parseInt(e.target.value)})}>
                  <option value="">Select Stage</option>
                  {stages.filter(s => s.approval_required).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approver Role</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={ruleForm.approver_role} onChange={e => setRuleForm({...ruleForm, approver_role: e.target.value})}>
                  <option value="APPROVER">APPROVER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Approvals</label>
                <input type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={ruleForm.min_approvals} onChange={e => setRuleForm({...ruleForm, min_approvals: parseInt(e.target.value)})} />
              </div>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Rule</button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b"><h3 className="font-semibold">Approval Rules</h3></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-left">Approver Role</th>
                  <th className="px-4 py-3 text-left">Min Approvals</th>
                  <th className="px-4 py-3 text-left">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{r.stage?.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.approver_role} /></td>
                    <td className="px-4 py-3">{r.min_approvals}</td>
                    <td className="px-4 py-3">{r.is_active ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
