import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Loading, Select } from '../../../components/common';
import { StatusBadge } from '../../../components/privacy/StatusBadge';
import { getAdminRequests, type RequestStatus } from '../../../api/privacy';
import { queryKeys } from '../../../api/queryKeys';
import { REQUEST_TYPE_LABELS, STATUS_LABELS, formatDate } from '../../../lib/privacyLabels';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...(Object.keys(STATUS_LABELS) as RequestStatus[]).map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function PrivacyRequestsTab() {
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(0);
  const filters = { status: status || undefined, overdue, page };

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.adminRequests(filters),
    queryFn: () => getAdminRequests(filters),
  });
  const rows = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <Card title="Request queue" description="Oldest due date first. Overdue requests are flagged.">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            disabled={overdue}
            onChange={(e) => { setStatus(e.target.value as RequestStatus | ''); setPage(0); }}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => { setOverdue(e.target.checked); setPage(0); }}
          />
          Overdue only
        </label>
        {overdue && <p className="pb-2 text-xs text-slate-500">Overdue only ignores the status filter</p>}
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No requests match these filters.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Request</th>
              <th>Type</th>
              <th>Requester</th>
              <th>Status</th>
              <th>Due</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.requestId}>
                <td className="py-2 font-medium">#{r.requestId}</td>
                <td>{REQUEST_TYPE_LABELS[r.type]}</td>
                <td>User {r.userId}</td>
                <td><StatusBadge status={r.status} /></td>
                <td>
                  {formatDate(r.dueAt)}
                  {r.overdue && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Overdue</span>
                  )}
                </td>
                <td className="text-right">
                  <Link className="font-semibold text-[#9c6b1a] hover:underline" to={`/privacy-admin/requests/${r.requestId}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </Card>
  );
}
