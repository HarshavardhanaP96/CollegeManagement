import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Loading } from '../../../components/common';
import { getPrivacyAudit } from '../../../api/privacy';
import { queryKeys } from '../../../api/queryKeys';

export function PrivacyAuditTab() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.audit(page),
    queryFn: () => getPrivacyAudit(page),
  });
  const rows = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 1;

  return (
    <Card title="Audit log" description="Every consent, request, erasure and retention action, newest first.">
      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No privacy activity recorded yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">When</th><th>Action</th><th>By</th><th>About</th><th>Details</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.auditId}>
                <td className="py-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="font-medium">{r.action}</td>
                <td>{r.actorId ? `User ${r.actorId}` : 'System'}</td>
                <td>{r.subjectUserId ? `User ${r.subjectUserId}` : '—'}</td>
                <td className="text-slate-500">{r.details}</td>
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
