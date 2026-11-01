import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading, Select, Textarea } from '../../../components/common';
import { StatusBadge } from '../../../components/privacy/StatusBadge';
import { getAdminRequest, resolveRequest, reviewRequest, type ResolveOutcome } from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { REQUEST_TYPE_LABELS, formatDate } from '../../../lib/privacyLabels';

function parseCorrection(payload: string | null): [string, string][] {
  if (!payload) return [];
  try {
    return Object.entries(JSON.parse(payload) as Record<string, string>);
  } catch {
    return [];
  }
}

export function PrivacyRequestDetailPage() {
  const requestId = Number(useParams().id);
  return <RequestDetail key={requestId} requestId={requestId} />;
}

function RequestDetail({ requestId }: { requestId: number }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: queryKeys.privacy.adminRequest(requestId),
    queryFn: () => getAdminRequest(requestId),
  });

  const [outcome, setOutcome] = useState<ResolveOutcome>('COMPLETED');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => setError(getErrorMessage(err).message);

  const review = useMutation({
    mutationFn: () => reviewRequest(requestId),
    onSuccess: () => { setError(null); return refresh(); },
    onError,
  });
  const resolve = useMutation({
    mutationFn: () => resolveRequest(requestId, { outcome, note: note.trim() }),
    onSuccess: () => {
      setError(null);
      setNote('');
      setConfirmed(false);
      setOutcome('COMPLETED');
      return refresh();
    },
    onError,
  });

  if (!data) return <Loading />;
  const { request, correctionPayload, events } = data.data;
  const irreversible = request.type === 'ERASURE' && outcome !== 'REJECTED';
  const canResolve = note.trim().length > 0 && (!irreversible || confirmed);

  const outcomeOptions = [
    { value: 'COMPLETED', label: 'Completed' },
    ...(request.type === 'ERASURE' ? [{ value: 'PARTIALLY_COMPLETED', label: 'Partially completed (some records retained)' }] : []),
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <Link to="/privacy-admin" className="text-sm font-semibold text-[#9c6b1a] hover:underline">← Back to requests</Link>

      <Card
        title={`Request #${request.requestId} · ${REQUEST_TYPE_LABELS[request.type]}`}
        description={`User ${request.userId} · Submitted ${formatDate(request.submittedAt)} · Due ${formatDate(request.dueAt)}`}
        headerActions={<StatusBadge status={request.status} />}
      >
        {request.details && <p className="whitespace-pre-line text-sm text-slate-700">{request.details}</p>}
        {parseCorrection(correctionPayload).length > 0 && (
          <dl className="mt-3 space-y-1 text-sm">
            {parseCorrection(correctionPayload).map(([field, value]) => (
              <div key={field} className="flex gap-2">
                <dt className="font-semibold text-slate-700">{field}</dt>
                <dd className="text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {request.resolutionNote && (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-700">{request.resolutionNote}</p>
        )}
      </Card>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {request.status === 'SUBMITTED' && (
        <Button onClick={() => review.mutate()} isLoading={review.isPending}>Start review</Button>
      )}

      {request.status === 'IN_REVIEW' && (
        <Card title="Resolve this request">
          <div className="space-y-4">
            <Select
              label="Outcome"
              options={outcomeOptions}
              value={outcome}
              onChange={(e) => { setOutcome(e.target.value as ResolveOutcome); setConfirmed(false); }}
            />
            <Textarea label="Resolution note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            {irreversible && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p>
                  Erasure anonymises the person's name, email, phone and profile details. This cannot be undone.
                  Marks and attendance are kept without the person's identity.
                </p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  I understand this cannot be undone
                </label>
              </div>
            )}
            <Button onClick={() => resolve.mutate()} disabled={!canResolve} isLoading={resolve.isPending}>
              Resolve request
            </Button>
          </div>
        </Card>
      )}

      <Card title="History">
        <ol className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={i}>
              <span className="font-medium">{e.toStatus.replace('_', ' ').toLowerCase()}</span>
              <span className="text-slate-500"> · {formatDate(e.occurredAt)}{e.actorId ? ` · user ${e.actorId}` : ''}</span>
              {e.note && <p className="text-slate-600">{e.note}</p>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
