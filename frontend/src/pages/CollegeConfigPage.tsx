import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Input, Breadcrumbs, Loading } from '../components/common';
import { getNotificationConfig, updateNotificationConfig } from '../api/notificationConfig';
import type { NotificationConfigRequest } from '../api/notificationConfig';
import { getCollegeById } from '../api/college';
import { getErrorMessage } from '../api/client';
import { queryKeys } from '../api/queryKeys';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

const emptyForm: NotificationConfigRequest = {
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpFromEmail: '',
  smtpFromName: '',
  smtpUseSsl: true,
  smtpEnabled: false,
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappPhoneNumberId: '',
  whatsappBusinessAccountId: '',
  whatsappEnabled: false,
};

function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 select-none">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}

export function CollegeConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { can } = usePermissions();

  // SUPERADMIN reaches this via /colleges/:id/config (any college); COLLEGEADMIN reaches it
  // via /college-config (their own college only, no :id in the URL).
  const collegeId = id ? Number(id) : user?.collegeId;
  const readOnly = !can('update', 'collegeConfig');

  const [formData, setFormData] = useState<NotificationConfigRequest>(emptyForm);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // GET /colleges/{id} is SUPERADMIN-only (CollegeController), so only fetch it on the
  // /colleges/:id/config path — COLLEGEADMIN always 403s here and gets "your college" instead.
  const { data: collegeData } = useQuery({
    queryKey: queryKeys.colleges.byId(collegeId ?? -1),
    queryFn: () => getCollegeById(collegeId!),
    enabled: !!collegeId && !!id,
  });

  const { data: configData, isLoading } = useQuery({
    queryKey: queryKeys.notificationConfig.byCollege(collegeId ?? -1),
    queryFn: () => getNotificationConfig(collegeId!),
    enabled: !!collegeId,
  });

  const config = configData?.data;

  useEffect(() => {
    if (!config) return;
    setFormData({
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort ?? 587,
      smtpUsername: config.smtpUsername || '',
      smtpPassword: '',
      smtpFromEmail: config.smtpFromEmail || '',
      smtpFromName: config.smtpFromName || '',
      smtpUseSsl: config.smtpUseSsl !== false,
      smtpEnabled: config.smtpEnabled || false,
      whatsappApiUrl: config.whatsappApiUrl || '',
      whatsappApiKey: '',
      whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
      whatsappBusinessAccountId: config.whatsappBusinessAccountId || '',
      whatsappEnabled: config.whatsappEnabled || false,
    });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (payload: NotificationConfigRequest) => updateNotificationConfig(collegeId!, payload),
    onSuccess: () => {
      setSuccessMsg('Configuration saved successfully.');
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationConfig.byCollege(collegeId!) });
    },
    onError: (error) => {
      setSuccessMsg(null);
      setServerError(getErrorMessage(error).message);
    },
  });

  const setField = <K extends keyof NotificationConfigRequest>(key: K, value: NotificationConfigRequest[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setServerError(null);
    setSuccessMsg(null);
    saveMutation.mutate(formData);
  };

  if (!collegeId) {
    return (
      <Card><p className="text-center text-slate-500 py-8">No college is associated with your account.</p></Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header>
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Colleges', path: '/colleges' }, { label: 'Configuration' }]} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuration</h1>
            <p className="mt-1 text-slate-500 font-medium">
              Email (SMTP) and WhatsApp settings for {collegeData?.data.collegeName || (id ? `college #${collegeId}` : 'your college')}.
              {readOnly && ' Only a Super Admin can make changes here.'}
            </p>
          </div>
          {id && (
            <Button variant="secondary" onClick={() => navigate(`/colleges/${collegeId}`)}>Back to Institution</Button>
          )}
        </div>
      </header>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16"><Loading text="Loading configuration…" /></Card>
      ) : (
        <Card>
          {serverError && (
            <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
              {serverError}
            </div>
          )}
          {successMsg && (
            <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Email (SMTP)</h2>
                <Checkbox label="Enabled" checked={!!formData.smtpEnabled} disabled={readOnly} onChange={(v) => setField('smtpEnabled', v)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Host" placeholder="smtp.example.com" value={formData.smtpHost} disabled={readOnly}
                  onChange={(e) => setField('smtpHost', e.target.value)} />
                <Input label="Port" type="number" value={formData.smtpPort ?? ''} disabled={readOnly}
                  onChange={(e) => setField('smtpPort', e.target.value ? Number(e.target.value) : undefined)} />
              </div>

              <Input label="Username" value={formData.smtpUsername} disabled={readOnly}
                onChange={(e) => setField('smtpUsername', e.target.value)} />

              <Input
                label={`Password${config?.smtpPasswordSet ? ' (set)' : ''}`}
                type="password"
                placeholder={config?.smtpPasswordSet ? '••••••••' : 'Enter password'}
                value={formData.smtpPassword}
                disabled={readOnly}
                onChange={(e) => setField('smtpPassword', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="From Email" type="email" value={formData.smtpFromEmail} disabled={readOnly}
                  onChange={(e) => setField('smtpFromEmail', e.target.value)} />
                <Input label="From Name" value={formData.smtpFromName} disabled={readOnly}
                  onChange={(e) => setField('smtpFromName', e.target.value)} />
              </div>

              <Checkbox label="Use SSL/TLS" checked={!!formData.smtpUseSsl} disabled={readOnly} onChange={(v) => setField('smtpUseSsl', v)} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">WhatsApp Cloud API</h2>
                <Checkbox label="Enabled" checked={!!formData.whatsappEnabled} disabled={readOnly} onChange={(v) => setField('whatsappEnabled', v)} />
              </div>

              <Input label="API URL" placeholder="https://graph.facebook.com/v17.0/" value={formData.whatsappApiUrl} disabled={readOnly}
                onChange={(e) => setField('whatsappApiUrl', e.target.value)} />

              <Input
                label={`Access Token / API Key${config?.whatsappApiKeySet ? ' (set)' : ''}`}
                type="password"
                placeholder={config?.whatsappApiKeySet ? '••••••••' : 'Enter access token'}
                value={formData.whatsappApiKey}
                disabled={readOnly}
                onChange={(e) => setField('whatsappApiKey', e.target.value)}
              />

              <Input label="Phone Number ID" value={formData.whatsappPhoneNumberId} disabled={readOnly}
                onChange={(e) => setField('whatsappPhoneNumberId', e.target.value)} />

              <Input label="Business Account ID" value={formData.whatsappBusinessAccountId} disabled={readOnly}
                onChange={(e) => setField('whatsappBusinessAccountId', e.target.value)} />
            </div>
          </div>

          {!readOnly && (
            <div className="mt-8 flex items-center justify-end gap-4 border-t border-slate-100 pt-6">
              <Button onClick={handleSave} isLoading={saveMutation.isPending} className="px-10">
                Save Configuration
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
