import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Loading, Modal, Select, Textarea } from '../components/common';
import { StatusBadge } from '../components/privacy/StatusBadge';
import { useAuthStore } from '../store/authStore';
import {
  cancelRequest, createRequest, downloadExport, getCurrentNotice, getMyRequest, getMyRequests, recordConsent,
  type ConsentStatus, type DataRequestView, type RequestType,
} from '../api/privacy';
import { getErrorMessage } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { CORRECTABLE_FIELDS, REQUEST_TYPE_LABELS, formatDate } from '../lib/privacyLabels';

const TYPE_OPTIONS = (Object.keys(REQUEST_TYPE_LABELS) as RequestType[]).map((value) => ({
  value,
  label: REQUEST_TYPE_LABELS[value],
}));

export function MyPrivacyPage() {
  const queryClient = useQueryClient();
  const roleName = useAuthStore((s) => s.user?.roleName ?? '');
  const fields = CORRECTABLE_FIELDS[roleName] ?? CORRECTABLE_FIELDS.TEACHER;

  const notice = useQuery({ queryKey: queryKeys.privacy.notice, queryFn: getCurrentNotice });
  const requests = useQuery({ queryKey: queryKeys.privacy.myRequests, queryFn: getMyRequests });

  const [type, setType] = useState<RequestType>('ACCESS');
  const [details, setDetails] = useState('');
  const [field, setField] = useState(fields[0].value);
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => setPageError(getErrorMessage(err).message);

  const submit = useMutation({
    mutationFn: (req: Parameters<typeof createRequest>[0]) => createRequest(req),
    onSuccess: () => {
      setDetails('');
      setValue('');
      setFormError(null);
      setPageError(null);
      refresh();
    },
    onError: (err) => setFormError(getErrorMessage(err).message),
  });
  const consent = useMutation({
    mutationFn: ({ purposeId, status }: { purposeId: number; status: ConsentStatus }) => recordConsent(purposeId, status),
    onSuccess: () => { setPageError(null); refresh(); },
    onError,
  });
  const cancel = useMutation({
    mutationFn: (id: number) => cancelRequest(id),
    onSuccess: () => { setPageError(null); refresh(); },
    onError,
  });

  const handleSubmit = () => {
    setFormError(null);
    if (type === 'GRIEVANCE' && !details.trim()) {
      setFormError('Please describe your grievance');
      return;
    }
    if (type === 'CORRECTION' && !value.trim()) {
      setFormError('Enter the new value');
      return;
    }
    submit.mutate({
      type,
      details: details.trim() || undefined,
      correction: type === 'CORRECTION' ? { [field]: value.trim() } : undefined,
    });
  };

  const handleDownload = async (id: number) => {
    try {
      const blob = await downloadExport(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-request-${id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      onError(err);
    }
  };

  const purposes = notice.data?.data.purposes ?? [];

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Privacy</h1>
        <p className="text-sm text-slate-500">Control how your personal data is used and ask the college about it.</p>
      </div>

      {pageError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>}

      <Card title="Your consents" description={notice.data?.data.version ? `Privacy notice version ${notice.data.data.version}` : undefined}>
        {notice.isLoading ? (
          <Loading />
        ) : (
          <ul className="divide-y divide-slate-100">
            {purposes.map((p) => (
              <li key={p.purposeId} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                </div>
                {p.legalBasis !== 'CONSENT' || !p.withdrawable ? (
                  <span className="text-sm text-slate-500">Required for your enrolment</span>
                ) : p.status === 'GRANTED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Withdraw consent: ${p.name}`}
                    onClick={() => consent.mutate({ purposeId: p.purposeId, status: 'WITHDRAWN' })}
                  >
                    Withdraw
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    aria-label={`Give consent: ${p.name}`}
                    onClick={() => consent.mutate({ purposeId: p.purposeId, status: 'GRANTED' })}
                  >
                    Give consent
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Make a request" description="The college must respond by the due date shown on your request.">
        <div className="space-y-4">
          <Select
            label="Request type"
            options={TYPE_OPTIONS}
            value={type}
            onChange={(e) => { setType(e.target.value as RequestType); setFormError(null); }}
          />
          {type === 'CORRECTION' && (
            <>
              <Select label="Field to correct" options={fields} value={field} onChange={(e) => setField(e.target.value)} />
              <Input label="New value" value={value} onChange={(e) => setValue(e.target.value)} />
            </>
          )}
          {type === 'ERASURE' && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Your identity is removed from your account, but your marks and attendance are kept without your name
              because the college must retain academic records.
            </p>
          )}
          <Textarea
            label={type === 'GRIEVANCE' ? 'Describe your grievance' : 'Details (optional)'}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
          <Button onClick={handleSubmit} isLoading={submit.isPending}>Submit request</Button>
        </div>
      </Card>

      <Card title="Your requests">
        {requests.isLoading ? (
          <Loading />
        ) : (requests.data?.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">You have not made any requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(requests.data?.data ?? []).map((r: DataRequestView) => (
              <li key={r.requestId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-slate-900">
                    Request #{r.requestId} · {REQUEST_TYPE_LABELS[r.type]}
                  </p>
                  <p className="text-sm text-slate-500">
                    Submitted {formatDate(r.submittedAt)} · Response due {formatDate(r.dueAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <Button size="sm" variant="ghost" onClick={() => setHistoryId(r.requestId)}>History</Button>
                  {r.status === 'SUBMITTED' && (
                    <Button size="sm" variant="outline" onClick={() => cancel.mutate(r.requestId)}>Cancel request</Button>
                  )}
                  {r.type === 'ACCESS' && r.status === 'COMPLETED' && (
                    <Button size="sm" onClick={() => handleDownload(r.requestId)}>Download my data</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {historyId !== null && <HistoryModal requestId={historyId} onClose={() => setHistoryId(null)} />}
    </div>
  );
}

function HistoryModal({ requestId, onClose }: { requestId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.privacy.myRequest(requestId),
    queryFn: () => getMyRequest(requestId),
  });
  const detail = data?.data;
  return (
    <Modal isOpen onClose={onClose} title={`Request #${requestId} history`}>
      {isLoading || !detail ? (
        <Loading />
      ) : (
        <ol className="space-y-2 text-sm">
          {detail.events.map((e, i) => (
            <li key={i}>
              <span className="font-medium">{e.toStatus.replace('_', ' ').toLowerCase()}</span>
              <span className="text-slate-500"> · {formatDate(e.occurredAt)}</span>
              {e.note && <p className="text-slate-600">{e.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
