import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Loading } from '../../components/common';
import { getAuditLog, type AuditAction, type AuditLogEntry } from '../../api/auditLog';
import { queryKeys } from '../../api/queryKeys';

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  LOGIN_SUCCESS: 'Signed in',
  LOGIN_FAILURE: 'Failed sign-in',
};

function describeChanges(entry: AuditLogEntry): string {
  if (!entry.changes) return '';
  try {
    const parsed = JSON.parse(entry.changes) as Record<string, unknown>;
    return Object.entries(parsed)
      .map(([field, value]) => {
        if (value && typeof value === 'object' && 'to' in value) {
          const { from, to } = value as { from: unknown; to: unknown };
          return `${field}: ${String(from ?? '—')} → ${String(to ?? '—')}`;
        }
        return `${field}: ${String(value)}`;
      })
      .join('; ');
  } catch {
    return entry.changes;
  }
}

export function AuditLogPage() {
  const [action, setAction] = useState<AuditAction | ''>('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(0);

  const filters = {
    action: action || undefined,
    entityType: entityType.trim() || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    size: PAGE_SIZE,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.auditLog.list(filters),
    queryFn: () => getAuditLog(filters),
    placeholderData: keepPreviousData,
  });

  const entries = data?.data.content ?? [];
  const totalPages = data?.data.totalPages ?? 0;

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const fieldClass = 'h-10 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900';

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="px-2 shrink-0 space-y-1">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Audit log</h1>
        <p className="text-slate-500 text-sm">
          A record of changes and sign-ins in your college. Entries are read-only and newest first.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-3 px-2">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Action
          <select
            className={fieldClass}
            value={action}
            onChange={(e) => resetPage(setAction)(e.target.value as AuditAction | '')}
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Record type
          <input
            className={fieldClass}
            placeholder="e.g. Department"
            value={entityType}
            onChange={(e) => resetPage(setEntityType)(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          From
          <input type="date" className={fieldClass} value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          To
          <input type="date" className={fieldClass} value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
        </label>
      </div>

      <div className="flex-1 min-h-0">
        {isLoading ? (
          <Card className="h-full flex items-center justify-center">
            <Loading size="lg" text="Loading audit log…" />
          </Card>
        ) : isError ? (
          <Card><p className="text-center text-red-600 py-8">Could not load the audit log.</p></Card>
        ) : entries.length === 0 ? (
          <Card><p className="text-center text-slate-500 py-8">No matching activity.</p></Card>
        ) : (
          <Card noPadding className="border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{entry.actorUsername ?? 'System'}</TableCell>
                    <TableCell>{ACTION_LABELS[entry.action] ?? entry.action}</TableCell>
                    <TableCell>{entry.entityType}{entry.entityId ? ` #${entry.entityId}` : ''}</TableCell>
                    <TableCell className="text-slate-600 text-xs">{describeChanges(entry)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3 px-2">
          <span className="text-sm text-slate-500">Page {page + 1} of {totalPages}</span>
          <Button onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>Previous</Button>
          <Button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
}
