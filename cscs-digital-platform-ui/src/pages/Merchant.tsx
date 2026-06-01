import React, { useState, useEffect } from 'react';
import { Building, Shield, Save, Loader2 } from 'lucide-react';
import api, { unwrapResponse } from '../services/api';

const Merchant: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states for Settings card
  const [passwordExpiryTime, setPasswordExpiryTime] = useState('0');
  const [passwordWarmingDay, setPasswordWarmingDay] = useState(-1);

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [infoRes, settingsRes] = await Promise.all([
        api.get('/merchant/info'),
        api.get('/merchant/settings'),
      ]);

      const infoData = unwrapResponse<any>(infoRes);
      const settingsData = unwrapResponse<any>(settingsRes);

      setInfo(infoData);
      setSettings(settingsData);

      if (settingsData) {
        setPasswordExpiryTime(settingsData.passwordExpiryTime != null ? String(settingsData.passwordExpiryTime) : '0');
        setPasswordWarmingDay(settingsData.passwordWarmingDay != null ? Number(settingsData.passwordWarmingDay) : -1);
      }
    } catch (err: any) {
      console.error('Error fetching merchant data', err);
      setError(err.message || 'Failed to fetch merchant details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        merchantName: settings?.merchantName || info?.merchantName || 'DG0358',
        passwordExpiryTime: passwordExpiryTime,
        passwordWarmingDay: Number(passwordWarmingDay),
      };

      const res = await api.put('/merchant/settings', payload);
      unwrapResponse(res);

      showNotification('Settings saved successfully / تم حفظ الإعدادات بنجاح', 'success');
      
      // Update local state copy
      setSettings({
        ...settings,
        passwordExpiryTime,
        passwordWarmingDay,
      });
    } catch (err: any) {
      console.error('Error saving settings', err);
      showNotification('Failed to save settings / فشل حفظ الإعدادات', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="merchant-container" style={{ padding: '24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Building size={28} color="var(--primary-color)" />
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Merchant Management / إدارة التاجر
          </h2>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-color)', marginBottom: '16px' }} />
          <p>Fetching merchant details from Dragon ESL... / جاري جلب بيانات التاجر...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchData} className="btn-primary">
            Try Again / أعد المحاولة
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* SECTION 1: Corporate Information */}
          <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
              <Building size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                Merchant Information / معلومات التاجر
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                  Merchant Number / رقم التاجر
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {info?.merchantId || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                  Merchant Name / اسم التاجر
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {info?.merchantName || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                  Contact Person / الشخص المسؤول
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {info?.name || 'No contact assigned / لم يتم التعيين'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                  Contact Details / تفاصيل الاتصال
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {info?.phone || 'No phone number provided / لا يوجد'}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>
                  Remarks / ملاحظات
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500', minHeight: '40px' }}>
                  {info?.comment || 'No remarks / لا يوجد ملاحظات'}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Account Settings */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <Shield size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                Account Settings / إعدادات الحساب
              </h3>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  Default Password Validity / صلاحية كلمة المرور الافتراضية
                </label>
                <select
                  value={passwordExpiryTime}
                  onChange={(e) => setPasswordExpiryTime(e.target.value)}
                  className="glass-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="0">Long / طويل (No expiry / بدون انتهاء صلاحية)</option>
                  <option value="90">90 days / ٩٠ يومًا</option>
                  <option value="180">180 days / ١٨٠ يومًا</option>
                  <option value="360">360 days / ٣٦٠ يومًا</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    Password Expiration Reminder / تذكير انتهاء الصلاحية
                  </label>
                </div>
                <input
                  type="number"
                  value={passwordWarmingDay}
                  onChange={(e) => setPasswordWarmingDay(Number(e.target.value))}
                  className="glass-input"
                  min="-1"
                  placeholder={passwordWarmingDay === -1 ? "Disabled (-1)" : "Reminder days / أيام التنبيه"}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  * Enter -1 to disable expiration reminders / أدخل -1 لتعطيل تذكيرات انتهاء الصلاحية
                </span>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Settings / حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      <style>{`
        .merchant-container {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 9999;
          font-weight: 500;
          animation: slideIn 0.3s ease-out;
        }

        .toast-notification.success {
          border-left: 4px solid var(--success-color);
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .toast-notification.error {
          border-left: 4px solid var(--danger-color);
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Merchant;
