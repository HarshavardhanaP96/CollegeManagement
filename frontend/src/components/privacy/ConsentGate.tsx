import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal } from '../common';
import { useAuthStore } from '../../store/authStore';
import { getCurrentNotice, recordConsent, type PurposeView } from '../../api/privacy';
import { getErrorMessage } from '../../api/client';
import { queryKeys } from '../../api/queryKeys';

const PRINCIPAL_ROLES = ['STUDENT', 'TEACHER'];

/**
 * Blocks the app with the privacy notice until a student or teacher has answered every consent purpose
 * under the latest notice version. Nothing is pre-ticked.
 */
export function ConsentGate() {
  const roleName = useAuthStore((s) => s.user?.roleName);
  const isPrincipal = !!roleName && PRINCIPAL_ROLES.includes(roleName);
  const queryClient = useQueryClient();
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: queryKeys.privacy.notice,
    queryFn: getCurrentNotice,
    enabled: isPrincipal,
  });
  const notice = data?.data;

  const save = useMutation({
    mutationFn: async (asked: PurposeView[]) => {
      for (const purpose of asked) {
        const granted = !purpose.withdrawable || ticked[purpose.purposeId] === true;
        await recordConsent(purpose.purposeId, granted ? 'GRANTED' : 'WITHDRAWN');
      }
    },
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['privacy'] });
    },
    onError: (err) => setError(getErrorMessage(err).message),
  });

  if (!isPrincipal || !notice?.requiresAction) return null;

  const asked = notice.purposes.filter((p) => p.legalBasis === 'CONSENT');
  const required = notice.purposes.filter((p) => p.legalBasis !== 'CONSENT');

  return (
    <Modal
      isOpen
      onClose={() => undefined}
      closeOnOverlayClick={false}
      size="lg"
      title={`Privacy notice (version ${notice.version})`}
      footer={
        <Button onClick={() => save.mutate(asked)} isLoading={save.isPending}>
          Save my choices
        </Button>
      }
    >
      <div className="space-y-4 text-sm text-slate-700">
        <p className="whitespace-pre-line">{notice.body}</p>

        {required.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900">Needed to run your enrolment</h4>
            <ul className="mt-1 list-disc pl-5">
              {required.map((p) => (
                <li key={p.purposeId}>
                  <span className="font-medium">{p.name}</span>
                  {p.description ? `: ${p.description}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {asked.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900">Your choices</h4>
            <ul className="mt-1 space-y-2">
              {asked.map((p) => (
                <li key={p.purposeId}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!p.withdrawable || ticked[p.purposeId] === true}
                      disabled={!p.withdrawable}
                      onChange={(e) => setTicked((prev) => ({ ...prev, [p.purposeId]: e.target.checked }))}
                    />
                    <span>
                      <span className="font-medium">{p.name}</span>
                      {p.description ? <span className="block text-slate-500">{p.description}</span> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">You can change these choices later on the My Privacy page.</p>
          </div>
        )}

        {error && <p role="alert" className="text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
