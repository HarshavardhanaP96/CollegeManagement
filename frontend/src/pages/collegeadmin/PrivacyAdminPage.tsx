import { useState } from 'react';
import { PrivacyAuditTab } from './privacy/PrivacyAuditTab';
import { PrivacyNoticeTab } from './privacy/PrivacyNoticeTab';
import { PrivacyRequestsTab } from './privacy/PrivacyRequestsTab';
import { PrivacyRetentionTab } from './privacy/PrivacyRetentionTab';

const TABS = [
  { key: 'requests', label: 'Requests' },
  { key: 'notice', label: 'Privacy notice' },
  { key: 'retention', label: 'Retention' },
  { key: 'audit', label: 'Audit log' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function PrivacyAdminPage() {
  const [tab, setTab] = useState<TabKey>('requests');

  return (
    <div className="h-full space-y-6 overflow-y-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy</h1>
        <p className="text-sm text-slate-500">Notice, consent, data-principal requests and retention for your college.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              tab === t.key ? 'bg-[#9c6b1a] text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requests' && <PrivacyRequestsTab />}
      {tab === 'notice' && <PrivacyNoticeTab />}
      {tab === 'retention' && <PrivacyRetentionTab />}
      {tab === 'audit' && <PrivacyAuditTab />}
    </div>
  );
}
