import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Loading, Textarea } from '../../../components/common';
import { getNotices, publishNotice } from '../../../api/privacy';
import { getErrorMessage } from '../../../api/client';
import { queryKeys } from '../../../api/queryKeys';
import { formatDate } from '../../../lib/privacyLabels';

export function PrivacyNoticeTab() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: queryKeys.privacy.notices, queryFn: getNotices });
  const publish = useMutation({
    mutationFn: () => publishNotice(text.trim()),
    onSuccess: () => {
      setText('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
    },
    onError: (err) => setError(getErrorMessage(err).message),
  });

  if (isLoading) return <Loading />;
  const [current, ...earlier] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <Card title="Privacy notice">
        {current ? (
          <>
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Current notice: version {current.version} (effective {formatDate(current.effectiveFrom)})
            </p>
            <p className="whitespace-pre-line text-sm text-slate-700">{current.body}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No notice has been published yet. Students and teachers see nothing until you publish one.</p>
        )}
        {earlier.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-500">
            {earlier.map((n) => (
              <li key={n.noticeId}>Version {n.version} · {formatDate(n.effectiveFrom)}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Publish a new version">
        <div className="space-y-4">
          <Textarea label="New notice text" value={text} onChange={(e) => setText(e.target.value)} rows={8} />
          <p className="text-sm text-slate-500">
            Everyone with a consent choice will be asked to review their choices again after you publish.
          </p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <Button onClick={() => publish.mutate()} disabled={!text.trim()} isLoading={publish.isPending}>
            Publish new version
          </Button>
        </div>
      </Card>
    </div>
  );
}
