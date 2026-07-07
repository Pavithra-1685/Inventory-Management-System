import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { PageLoader } from '../components/ui/Loading';
import { Pagination } from '../components/ui/DataTable';
import { useState } from 'react';

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page],
    queryFn: async () => (await api.get('/activity', { params: { page, limit: 20 } })).data,
  });

  const actionColors = {
    create: 'badge-success', update: 'badge-warning', delete: 'badge-danger',
    login: 'badge-info', logout: 'badge-default', export: 'badge-info',
  };

  if (isLoading) return <PageLoader />;
  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Full audit trail of all user actions across all modules.</p>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>IP Address</th><th>Date & Time</th></tr></thead>
          <tbody>
            {data?.data?.map(log => (
              <tr key={log._id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary text-white text-xs font-black flex items-center justify-center">
                      {log.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-xs">{log.user?.name || 'System'}</p>
                      <p className="text-[10px] text-secondary capitalize">{log.user?.role}</p>
                    </div>
                  </div>
                </td>
                <td><span className={`badge ${actionColors[log.action] || 'badge-default'} uppercase text-[10px]`}>{log.action}</span></td>
                <td><span className="badge badge-default text-[10px] uppercase">{log.module}</span></td>
                <td className="text-xs text-secondary max-w-xs truncate">{log.description}</td>
                <td className="font-mono text-xs">{log.ipAddress || '—'}</td>
                <td className="text-xs text-secondary">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={data?.pages || 1} total={data?.total || 0} limit={20} onPageChange={setPage} />
    </div>
  );
}
