import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';

const Reports = () => {
  const [tab, setTab] = useState('eco');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const endpoints = {
    eco: '/reports/eco',
    'product-history': '/reports/product-version-history',
    'bom-history': '/reports/bom-change-history',
    'archived-products': '/reports/archived-products',
    'active-matrix': '/reports/active-matrix',
  };

  useEffect(() => {
    setLoading(true);
    api.get(endpoints[tab]).then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, [tab]);

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/pdf/report/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Master-Report-${new Date().toLocaleDateString()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error', err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">System-wide analytics and historical data</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm transition-colors"
        >
          <Download size={16} /> Download PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {Object.keys(endpoints).map(k => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${tab === k ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {k.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading report...</div> : (
          <div className="overflow-x-auto">
            {tab === 'eco' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">ECO #</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Stage</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Requested By</th>
                    <th className="px-4 py-3 text-left">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono"><Link to={`/ecos/${e.id}`} className="text-blue-600 hover:underline">{e.eco_number}</Link></td>
                      <td className="px-4 py-3">{e.title}</td>
                      <td className="px-4 py-3"><StatusBadge status={e.eco_type} /></td>
                      <td className="px-4 py-3 font-mono text-xs">{e.product?.product_code}</td>
                      <td className="px-4 py-3">{e.current_stage?.name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3">{e.requester?.name}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(e.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'product-history' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Product Code</th>
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-right">Sale Price</th>
                    <th className="px-4 py-3 text-right">Cost Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created Via ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{v.product?.product_code}</td>
                      <td className="px-4 py-3 font-bold">v{v.version_no}</td>
                      <td className="px-4 py-3">{v.name}</td>
                      <td className="px-4 py-3 text-right">${Number(v.sale_price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${Number(v.cost_price).toFixed(2)}</td>
                      <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{v.created_via_eco?.eco_number || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'bom-history' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">BoM Code</th>
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Components</th>
                    <th className="px-4 py-3 text-left">Operations</th>
                    <th className="px-4 py-3 text-left">Created Via ECO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{v.bom?.bom_code}</td>
                      <td className="px-4 py-3 font-bold">v{v.version_no}</td>
                      <td className="px-4 py-3 font-mono text-xs">{v.bom?.product?.product_code}</td>
                      <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3">{v._count?.components ?? 0}</td>
                      <td className="px-4 py-3">{v._count?.operations ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">{v.created_via_eco?.eco_number|| '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'archived-products' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Product Code</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Archived At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{p.product_code}</td>
                      <td className="px-4 py-3">{p.current_version?.name || '-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-gray-400">{p.archived_at ? new Date(p.archived_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'active-matrix' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Active Version</th>
                    <th className="px-4 py-3 text-left">Active BoM(s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{p.product_code}</td>
                      <td className="px-4 py-3">v{p.current_version?.version_no} - {p.current_version?.name}</td>
                      <td className="px-4 py-3">{p.boms.map(b => `${b.bom_code} v${b.current_version?.version_no}`).join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {data.length === 0 && <p className="p-8 text-center text-gray-400">No data for this report</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
