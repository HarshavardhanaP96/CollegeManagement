import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Input, Loading } from '../../../components/common';
import {
  getRetentionPolicies, getRetentionRuns, runRetention, saveRetentionPolicies,
  type RetentionPolicy, type RetentionRun,
} from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { formatDate } from '../../../lib/privacyLabels';

interface Edit {
  days: string;
  enabled: boolean;
}

export function PrivacyRetentionTab() {
  const queryClient = useQueryClient();
  const policies = useQuery({ queryKey: queryKeys.privacy.policies, queryFn: getRetentionPolicies });
  const runs = useQuery({ queryKey: queryKeys.privacy.runs, queryFn: getRetentionRuns });

  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['privacy'] });
  const onError = (err: unknown) => { setLiveConfirmed(false); setMessage(null); setError(getErrorMessage(err).message); };

  const editFor = (p: RetentionPolicy): Edit =>
    edits[p.dataCategory] ?? { days: String(p.retentionDays), enabled: p.enabled };

  const save = useMutation({
    mutationFn: () =>
      saveRetentionPolicies(
        (policies.data?.data ?? []).map((p) => ({
          dataCategory: p.dataCategory,
          retentionDays: Number(editFor(p).days),
          triggerEvent: p.triggerEvent,
          action: p.action,
          enabled: editFor(p).enabled,
        })),
      ),
    onSuccess: () => { setError(null); setMessage('Policy saved.'); setEdits({}); refresh(); },
    onError,
  });

  const run = useMutation({
    mutationFn: (dryRun: boolean) => runRetention(dryRun),
    onSuccess: (res) => {
      const r = res.data;
      setError(null);
      setMessage(
        r.dryRun
          ? `Dry run: ${r.recordsProcessed} account(s) would be anonymised.`
          : `Anonymised ${r.recordsProcessed} account(s); ${r.recordsFailed} failed.`,
      );
      setLiveConfirmed(false);
      refresh();
    },
    onError,
  });

  const handleSave = () => {
    const invalid = (policies.data?.data ?? []).some((p) => {
      const days = Number(editFor(p).days);
      return !Number.isInteger(days) || days < 1;
    });
    if (invalid) {
      setMessage(null);
      setError('Retention period must be a whole number of days, at least 1');
      return;
    }
    save.mutate();
  };

  if (policies.isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {message && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card
        title="Retention policy"
        description="Deactivated student and teacher accounts older than the period below are anonymised. Marks and attendance are kept."
      >
        {(policies.data?.data ?? []).map((p) => (
          <div key={p.dataCategory} className="space-y-4">
            <div className="max-w-xs">
              <Input
                label="Retention period (days)"
                type="number"
                min={1}
                value={editFor(p).days}
                onChange={(e) => setEdits((prev) => ({ ...prev, [p.dataCategory]: { ...editFor(p), days: e.target.value } }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editFor(p).enabled}
                onChange={(e) => setEdits((prev) => ({ ...prev, [p.dataCategory]: { ...editFor(p), enabled: e.target.checked } }))}
              />
              Enabled
            </label>
            <p className="text-xs text-slate-500">
              The default period is a placeholder, not legal advice. Agree the real period with your counsel before enabling.
            </p>
          </div>
        ))}
        <div className="mt-4">
          <Button onClick={handleSave} isLoading={save.isPending}>Save policy</Button>
        </div>
      </Card>

      <Card title="Run retention">
        <div className="space-y-4">
          <div>
            <Button variant="outline" onClick={() => run.mutate(true)} isLoading={run.isPending && run.variables === true} disabled={run.isPending}>Preview (dry run)</Button>
            <p className="mt-1 text-xs text-slate-500">Counts what would change without changing anything.</p>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={liveConfirmed} onChange={(e) => setLiveConfirmed(e.target.checked)} />
              I understand a live run permanently anonymises accounts
            </label>
            <Button
              variant="danger"
              disabled={!liveConfirmed || run.isPending}
              isLoading={run.isPending && run.variables === false}
              onClick={() => run.mutate(false)}
            >Run now (live)</Button>
          </div>
        </div>
      </Card>

      <Card title="Run history">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr><th className="py-2">Started</th><th>Mode</th><th>Status</th><th>Processed</th><th>Failed</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(runs.data?.data.content ?? []).map((r: RetentionRun) => (
              <tr key={r.runId}>
                <td className="py-2">{formatDate(r.startedAt)}</td>
                <td>{r.dryRun ? 'Dry run' : 'Live'}</td>
                <td>{r.status}</td>
                <td>{r.recordsProcessed}</td>
                <td>{r.recordsFailed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
