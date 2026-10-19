import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Loading } from './common';
import {
  getNotificationChannelRules,
  updateNotificationChannelRules,
  type NotificationChannelRule,
  type NotificationEventType,
} from '../api/notificationChannelRules';
import { getErrorMessage } from '../api/client';
import { queryKeys } from '../api/queryKeys';

const EVENT_LABELS: Record<NotificationEventType, string> = {
  ATTENDANCE_ABSENCE: 'Student absence',
  MARKS_PUBLISHED: 'Marks published',
  FEE_REMINDER: 'Fee reminder',
  ANNOUNCEMENT: 'Announcement',
};

export function NotificationChannelRulesCard({ collegeId }: { collegeId: number }) {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState<NotificationChannelRule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notificationChannelRules.byCollege(collegeId),
    queryFn: () => getNotificationChannelRules(collegeId),
  });

  useEffect(() => {
    if (data?.data) setRules(data.data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateNotificationChannelRules(collegeId, rules),
    onSuccess: () => {
      setError(null);
      setSuccess('Channel settings saved.');
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationChannelRules.byCollege(collegeId) });
    },
    onError: (err) => {
      setSuccess(null);
      setError(getErrorMessage(err).message);
    },
  });

  const toggle = (eventType: NotificationEventType, channel: 'emailEnabled' | 'whatsappEnabled', value: boolean) => {
    setSuccess(null);
    setRules((prev) => prev.map((r) => (r.eventType === eventType ? { ...r, [channel]: value } : r)));
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Notification Channels</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">Choose which channels deliver each type of notification.</p>
      </div>

      {isLoading ? (
        <Loading text="Loading channel settings…" />
      ) : (
        <>
          {error && <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
          {success && <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>}

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="py-2">Event</th>
                <th className="py-2 text-center">Email</th>
                <th className="py-2 text-center">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.eventType} className="border-b border-slate-50">
                  <td className="py-3 font-semibold text-slate-700">{EVENT_LABELS[r.eventType]}</td>
                  <td className="py-3 text-center">
                    <input type="checkbox" aria-label={`${EVENT_LABELS[r.eventType]} via email`} checked={r.emailEnabled}
                      onChange={(e) => toggle(r.eventType, 'emailEnabled', e.target.checked)} />
                  </td>
                  <td className="py-3 text-center">
                    <input type="checkbox" aria-label={`${EVENT_LABELS[r.eventType]} via WhatsApp`} checked={r.whatsappEnabled}
                      onChange={(e) => toggle(r.eventType, 'whatsappEnabled', e.target.checked)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => saveMutation.mutate()} isLoading={saveMutation.isPending} className="px-10">
              Save Channels
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
