import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import api from '../utils/api';
import ECODetailModal from '../components/ECODetailModal';

const Reports = () => {
  const [ecos, setEcos] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEco, setSelectedEco] = useState(null);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        // Normally we'd use dedicated endpoints for these tables. 
        // For the UI mockup, we'll fetch all ECOs and mock/fetch AuditLogs depending on backend readiness.
        const [ecosRes, logsRes] = await Promise.all([
          api.get('/ecos').catch(() => ({ data: [] })),
          api.get('/reports/audit-logs').catch(() => ({ data: [] }))
        ]);
        
        // Use ecos data for summary table
        setEcos(ecosRes.data);
        
        // Use real audit logs
        setLogs(logsRes.data);
        
      } catch (err) {
        console.error("Failed to fetch reports data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading reports data...</div>;

  return (
    <div className="space-y-8 max-w-[1200px]">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">ECO Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium">Stage</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ecos.map(eco => (
                <tr key={eco.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">{eco.title}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded font-medium">{eco.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{eco.type === 'BoM' ? eco.bom?.product?.name || `BoM #${eco.bom_id}` : eco.product?.name || `Product #${eco.product_id}`}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      eco.stage === 'New' ? 'bg-gray-100 text-gray-600' :
                      eco.stage === 'Approval' ? 'bg-amber-100 text-amber-800' :
                      eco.stage === 'Done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {eco.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{new Date(eco.created_at || Date.now()).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedEco(eco)}
                      className="inline-flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-medium text-xs transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Changes
                    </button>
                  </td>
                </tr>
              ))}
              {ecos.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No ECO data found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Audit Trail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium w-full">Summary</th>
                <th className="px-6 py-4 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">{log.user?.name || 'System'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded font-medium">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{log.smart_summary || log.action}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No Audit Trail found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEco && (
        <ECODetailModal eco={selectedEco} onClose={() => setSelectedEco(null)} />
      )}
    </div>
  );
};

export default Reports;
