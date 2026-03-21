import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft } from 'lucide-react';

const BomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [bom, setBom] = useState(null);
  const [versions, setVersions] = useState([]);
  const [tab, setTab] = useState('components');

  useEffect(() => {
    api.get(`/boms/${id}`).then(r => setBom(r.data.data));
    if (user.role !== 'OPERATIONS') {
      api.get(`/boms/${id}/versions`).then(r => setVersions(r.data.data));
    }
  }, [id]);

  if (!bom) return <div className="p-8 text-center text-gray-400">Loading BoM...</div>;

  const cv = bom.current_version;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/boms" className="p-2 rounded-lg border hover:bg-gray-50"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{bom.bom_code}</h1>
          <p className="text-sm text-gray-500">Product: <span className="font-mono">{bom.product?.product_code}</span></p>
        </div>
        <StatusBadge status={bom.status} />
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {['components', 'operations', ...(user.role !== 'OPERATIONS' ? ['versions'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
        ))}
      </div>

      {tab === 'components' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Components (Active Version v{cv?.version_no})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Line #</th>
                <th className="px-4 py-3 text-left">Component</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-left">UOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cv?.components?.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No components</td></tr>
              ) : cv?.components?.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{c.line_no}</td>
                  <td className="px-4 py-3 font-medium">{c.component_product?.product_code}</td>
                  <td className="px-4 py-3 text-right">{Number(c.quantity).toFixed(4)}</td>
                  <td className="px-4 py-3">{c.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'operations' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Operations (Active Version v{cv?.version_no})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Line #</th>
                <th className="px-4 py-3 text-left">Operation</th>
                <th className="px-4 py-3 text-left">Work Center</th>
                <th className="px-4 py-3 text-right">Duration (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cv?.operations?.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-400">No operations</td></tr>
              ) : cv?.operations?.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{o.line_no}</td>
                  <td className="px-4 py-3 font-medium">{o.operation_name}</td>
                  <td className="px-4 py-3 text-gray-600">{o.work_center}</td>
                  <td className="px-4 py-3 text-right">{Number(o.duration_minutes).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'versions' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created Via ECO</th>
                <th className="px-4 py-3 text-left">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versions.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">v{v.version_no}</td>
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

export default BomDetail;
