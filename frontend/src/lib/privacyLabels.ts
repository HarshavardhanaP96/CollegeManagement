import type { RequestStatus, RequestType } from '../api/privacy';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ACCESS: 'Access my data',
  CORRECTION: 'Correct my data',
  ERASURE: 'Erase my data',
  GRIEVANCE: 'Raise a grievance',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  SUBMITTED: 'Submitted',
  IN_REVIEW: 'In review',
  COMPLETED: 'Completed',
  PARTIALLY_COMPLETED: 'Partially completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

interface FieldOption {
  value: string;
  label: string;
}

const NAME_AND_PHONE: FieldOption[] = [
  { value: 'fullName', label: 'Full name' },
  { value: 'phone', label: 'Phone' },
];

/** Mirrors the backend contributors' correctable fields, per role. */
export const CORRECTABLE_FIELDS: Record<string, FieldOption[]> = {
  STUDENT: [
    ...NAME_AND_PHONE,
    { value: 'parentName', label: 'Parent or guardian name' },
    { value: 'parentPhone', label: 'Parent or guardian phone' },
    { value: 'parentEmail', label: 'Parent or guardian email' },
    { value: 'address', label: 'Address' },
  ],
  TEACHER: NAME_AND_PHONE,
};

export function formatDate(iso?: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}
