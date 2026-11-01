import type { RequestStatus } from '../../api/privacy';
import { STATUS_LABELS } from '../../lib/privacyLabels';

const STYLES: Record<RequestStatus, string> = {
  SUBMITTED: 'bg-slate-100 text-slate-700',
  IN_REVIEW: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  PARTIALLY_COMPLETED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
