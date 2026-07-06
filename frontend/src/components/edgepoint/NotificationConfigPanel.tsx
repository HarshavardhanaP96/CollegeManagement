import React, { useState, useEffect } from 'react';
import { getNotificationConfig, updateNotificationConfig, NotificationConfigDto, NotificationConfigRequest } from '../../api/notificationConfig';

interface Props {
  institutionId: string;
  institutionName: string;
  readOnly?: boolean;
  onClose?: () => void;
}

export function NotificationConfigPanel({ institutionId, institutionName, readOnly = false, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<NotificationConfigDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<NotificationConfigRequest>({
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
    whatsappEnabled: false
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const res = await getNotificationConfig(institutionId);
        if (res.success && res.data) {
          setConfig(res.data);
          setFormData({
            smtpHost: res.data.smtpHost || '',
            smtpPort: res.data.smtpPort || 587,
            smtpUsername: res.data.smtpUsername || '',
            smtpPassword: '',
            smtpFromEmail: res.data.smtpFromEmail || '',
            smtpFromName: res.data.smtpFromName || '',
            smtpUseSsl: res.data.smtpUseSsl !== false,
            smtpEnabled: res.data.smtpEnabled || false,
            whatsappApiUrl: res.data.whatsappApiUrl || '',
            whatsappApiKey: '',
            whatsappPhoneNumberId: res.data.whatsappPhoneNumberId || '',
            whatsappBusinessAccountId: res.data.whatsappBusinessAccountId || '',
            whatsappEnabled: res.data.whatsappEnabled || false
          });
        }
      } catch (err: any) {
        setError('Failed to load configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [institutionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const res = await updateNotificationConfig(institutionId, formData);
      if (res.success) {
        setSuccessMsg('Configuration saved successfully.');
        setConfig(res.data);
      } else {
        setError(res.error?.message || 'Failed to save configuration.');
      }
    } catch (err: any) {
      setError('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Loading configuration...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Notifications & Messaging</h2>
          <p className="text-sm text-gray-400">Configure SMTP and WhatsApp settings for {institutionName}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">✕</button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SMTP SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Email (SMTP)</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">Enabled</span>
              <input 
                type="checkbox" 
                name="smtpEnabled" 
                checked={formData.smtpEnabled} 
                onChange={handleChange}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Host</label>
                <input type="text" name="smtpHost" value={formData.smtpHost} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" placeholder="smtp.example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Port</label>
                <input type="number" name="smtpPort" value={formData.smtpPort} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
              <input type="text" name="smtpUsername" value={formData.smtpUsername} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password {config?.smtpPasswordSet && <span className="text-green-600 font-normal">(Set)</span>}
              </label>
              <input type="password" name="smtpPassword" value={formData.smtpPassword} onChange={handleChange} disabled={readOnly} placeholder={config?.smtpPasswordSet ? '••••••••' : 'Enter password'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">From Email</label>
                <input type="email" name="smtpFromEmail" value={formData.smtpFromEmail} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">From Name</label>
                <input type="text" name="smtpFromName" value={formData.smtpFromName} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
              </div>
            </div>
          </div>
        </div>

        {/* WHATSAPP SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">WhatsApp Cloud API</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">Enabled</span>
              <input 
                type="checkbox" 
                name="whatsappEnabled" 
                checked={formData.whatsappEnabled} 
                onChange={handleChange}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">API URL</label>
              <input type="text" name="whatsappApiUrl" value={formData.whatsappApiUrl} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" placeholder="https://graph.facebook.com/v17.0/" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Access Token / API Key {config?.whatsappApiKeySet && <span className="text-green-600 font-normal">(Set)</span>}
              </label>
              <input type="password" name="whatsappApiKey" value={formData.whatsappApiKey} onChange={handleChange} disabled={readOnly} placeholder={config?.whatsappApiKeySet ? '••••••••' : 'Enter access token'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number ID</label>
              <input type="text" name="whatsappPhoneNumberId" value={formData.whatsappPhoneNumberId} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Business Account ID</label>
              <input type="text" name="whatsappBusinessAccountId" value={formData.whatsappBusinessAccountId} onChange={handleChange} disabled={readOnly} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 border-t border-gray-50 flex items-center justify-between bg-gray-50">
        <div className="text-sm">
          {error && <span className="text-red-600 font-semibold">{error}</span>}
          {successMsg && <span className="text-emerald-600 font-semibold">{successMsg}</span>}
          {!error && !successMsg && <span className="text-gray-400">Settings take effect immediately upon saving.</span>}
        </div>
        {!readOnly && (
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gray-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        )}
      </div>
    </div>
  );
}
