import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get('/audit-logs').then(r => setLogs(r.data.data)).finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">Full system audit trail of all user actions</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading audit logs...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Summary</th>
                  <th className="px-4 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-400">No audit logs</td></tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700">{log.user?.name || 'System'}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 rounded">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.affected_type}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-64 truncate">{log.smart_summary || '-'}</td>
                      <td className="px-4 py-3">
                        {(log.old_value || log.new_value) && (
                          <button onClick={() => toggle(log.id)} className="text-blue-600 text-xs hover:underline">
                            {expanded[log.id] ? 'Hide' : 'Show'} JSON
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded[log.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan="6" className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">OLD VALUE</p>
                              <pre className="text-xs bg-red-50 p-2 rounded border border-red-100 overflow-auto max-h-40">{JSON.stringify(log.old_value, null, 2)}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">NEW VALUE</p>
                              <pre className="text-xs bg-green-50 p-2 rounded border border-green-100 overflow-auto max-h-40">{JSON.stringify(log.new_value, null, 2)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
