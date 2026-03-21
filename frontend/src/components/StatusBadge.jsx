import React from 'react';

const colors = {
  ACTIVE:      'bg-green-100 text-green-800',
  ARCHIVED:    'bg-gray-100 text-gray-600',
  DRAFT:       'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REJECTED:    'bg-red-100 text-red-800',
  APPLIED:     'bg-purple-100 text-purple-800',
  CANCELLED:   'bg-gray-100 text-gray-600',
  APPROVED:    'bg-green-100 text-green-800',
  VALIDATED:   'bg-teal-100 text-teal-800',
  PRODUCT:     'bg-orange-100 text-orange-800',
  BOM:         'bg-cyan-100 text-cyan-800',
  ADMIN:       'bg-red-100 text-red-800',
  ENGINEERING: 'bg-blue-100 text-blue-800',
  APPROVER:    'bg-purple-100 text-purple-800',
  OPERATIONS:  'bg-green-100 text-green-800',
};

const StatusBadge = ({ status }) => {
  const cls = colors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
