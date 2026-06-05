import React, { useState, useEffect, useRef } from 'react';
import { 
  Building, Shield, Save, Loader2, ChevronDown, User, 
  CheckCircle2, Phone, Mail, Clock, Key, AlertCircle, Info, Bell
} from 'lucide-react';
import api, { unwrapResponse } from '../services/api';
import { CustomSelect } from '../components/common/CustomSelect';

const Merchant: React.FC = () => {
  const [info, setInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states for Settings card
  const [passwordExpiryTime, setPasswordExpiryTime] = useState('0');
  const [passwordWarmingDay, setPasswordWarmingDay] = useState(-1);

  const expiryOptions = [
    { value: '0', label: 'Long / طويل (No expiry / بدون انتهاء صلاحية)' },
    { value: '30', label: '30 days / ٣٠ يومًا' },
    { value: '60', label: '60 days / ٦٠ يومًا' },
    { value: '90', label: '90 days / ٩٠ يومًا' },
    { value: '180', label: '180 days / ١٨٠ يومًا' },
    { value: '360', label: '360 days / ٣٦٠ يومًا' },
  ];

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

      const infoData = unwrapResponse(infoRes);
      const settingsData = unwrapResponse(settingsRes) as any;

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

  const getPasswordStatus = () => {
    if (passwordExpiryTime === '0') return 'No Expiry';
    return `${passwordExpiryTime} Days`;
  };

  return (
    <div className="saas-merchant-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="page-header">
        <h1>Merchant Management / إدارة التاجر</h1>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={40} />
          <p>Fetching enterprise details... / جاري جلب التفاصيل...</p>
        </div>
      ) : error ? (
        <div className="error-card">
          <AlertCircle size={32} />
          <p>{error}</p>
          <button onClick={fetchData} className="saas-btn-primary">
            Try Again / أعد المحاولة
          </button>
        </div>
      ) : (
        <div className="saas-content-layout">
          
          {/* 1. Merchant Header Section */}
          <div className="saas-card profile-header-card">
            <div className="profile-header-content">
              <div className="avatar-wrapper">
                <Building size={48} className="avatar-icon" />
              </div>
              <div className="profile-details">
                <div className="profile-title-row">
                  <h2>{info?.merchantName || 'N/A'}</h2>
                  <span className="status-badge active">
                    <CheckCircle2 size={14} /> Active
                  </span>
                </div>
                <div className="profile-meta">
                  <span className="meta-item">
                    <strong>Merchant ID:</strong> {info?.merchantId || 'N/A'}
                  </span>
                  <span className="meta-divider">•</span>
                  <span className="meta-item">
                    <User size={14} /> Contact Person: {info?.name || 'N/A'}
                  </span>
                  <span className="meta-divider">•</span>
                  <span className="meta-item">
                    <Clock size={14} /> Last Updated: Today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Overview Statistics Row */}
          <div className="stats-grid">
            <div className="saas-card stat-card">
              <div className="stat-icon-wrapper blue">
                <Building size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Merchant / التاجر</p>
                <p className="stat-value">Active</p>
              </div>
            </div>
            
            <div className="saas-card stat-card">
              <div className="stat-icon-wrapper purple">
                <Key size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Password / كلمة المرور</p>
                <p className="stat-value">{getPasswordStatus()}</p>
              </div>
            </div>

            <div className="saas-card stat-card">
              <div className="stat-icon-wrapper emerald">
                <Phone size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Contact / اتصال</p>
                <p className="stat-value">{info?.phone ? 'Available' : 'N/A'}</p>
              </div>
            </div>

            <div className="saas-card stat-card">
              <div className="stat-icon-wrapper amber">
                <Clock size={20} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Last Login / آخر دخول</p>
                <p className="stat-value">Today</p>
              </div>
            </div>
          </div>

          {/* Main Grid: Information & Settings */}
          <div className="main-content-grid">
            
            {/* 4. Account Settings Card */}
            <div className="saas-card settings-card">
              <div className="security-header-area">
                <div className="security-icon-wrapper">
                  <Shield size={24} />
                </div>
                <div className="security-header-text">
                  <h3>Account Security Settings / إعدادات أمان الحساب</h3>
                  <p>Configure merchant authentication policies and password management settings.</p>
                </div>
              </div>
              
              <form onSubmit={handleSaveSettings} className="settings-form">
                <div className="settings-body two-column-grid">
                  
                  {/* Password Validity Mini-Card */}
                  <div className="setting-mini-card">
                    <div className="setting-mini-card-header">
                      <div className="setting-mini-icon purple">
                        <Key size={18} />
                      </div>
                      <div className="setting-mini-title">
                        <label>Password Validity / صلاحية كلمة المرور</label>
                      </div>
                    </div>
                    <div className="setting-mini-content">
                      <CustomSelect
                        options={expiryOptions.map(opt => ({ value: opt.value, label: opt.label }))}
                        value={String(passwordExpiryTime)}
                        onChange={(val) => setPasswordExpiryTime(String(val))}
                        placeholder="Select / حدد"
                      />
                    </div>
                    <div className="setting-mini-helper">
                      Defines how long passwords remain valid.
                    </div>
                  </div>
                  
                  {/* Expiration Reminder Mini-Card */}
                  <div className="setting-mini-card">
                    <div className="setting-mini-card-header">
                      <div className="setting-mini-icon amber">
                        <Bell size={18} />
                      </div>
                      <div className="setting-mini-title">
                        <label>Expiration Reminder / تذكير انتهاء الصلاحية</label>
                      </div>
                    </div>
                    <div className="setting-mini-content">
                      <input
                        type="number"
                        value={passwordWarmingDay}
                        onChange={(e) => setPasswordWarmingDay(Number(e.target.value))}
                        className="saas-input"
                        min="-1"
                        placeholder={passwordWarmingDay === -1 ? "Disabled (-1)" : "Reminder days"}
                        required
                      />
                    </div>
                    <div className="setting-mini-helper">
                      Number of days before expiry to notify the merchant.
                    </div>
                  </div>
                  
                </div>

                {/* 5. Save Section Footer */}
                <div className="settings-action-footer">
                  <div className="settings-action-info">
                    <AlertCircle size={16} />
                    <span>Changes will apply to merchant account security settings.</span>
                  </div>
                  <button
                    type="submit"
                    className="saas-btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    <span>Save Changes / حفظ التغييرات</span>
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      )}

      {/* Scoped CSS for the SaaS Design */}
      <style>{`
        /* --------------------------------------
           SaaS Dashboard Styles
        -------------------------------------- */
        .saas-merchant-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 32px;
          letter-spacing: -0.02em;
        }

        /* --------------------------------------
           Cards Base
        -------------------------------------- */
        .saas-card {
          background: var(--card-bg, #ffffff);
          border-radius: 16px;
          border: 1px solid var(--glass-border, #E5E7EB);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        [data-theme="dark"] .saas-card {
          background: #1F2937;
          border-color: #374151;
        }

        .saas-content-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* --------------------------------------
           1. Header Section
        -------------------------------------- */
        .profile-header-card {
          padding: 32px;
        }

        .profile-header-content {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .avatar-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.25);
          flex-shrink: 0;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .profile-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .profile-title-row h2 {
          font-size: 26px;
          font-weight: 700;
          margin: 0;
          color: var(--text-primary);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-badge.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
        }

        .profile-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 14px;
          color: var(--text-muted, #6B7280);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-divider {
          color: #D1D5DB;
        }
        [data-theme="dark"] .meta-divider { color: #4B5563; }

        /* --------------------------------------
           2. Stats Row
        -------------------------------------- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
        }

        .stat-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
        .stat-icon-wrapper.purple { background: rgba(139, 92, 246, 0.1); color: #8B5CF6; }
        .stat-icon-wrapper.emerald { background: rgba(16, 185, 129, 0.1); color: #10B981; }
        .stat-icon-wrapper.amber { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          margin: 0;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted, #6B7280);
        }

        .stat-value {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* --------------------------------------
           Main Grid (Info & Settings)
        -------------------------------------- */
        .main-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .main-content-grid {
            grid-template-columns: 1fr;
          }
        }

        /* 4. Settings Card */
        .security-header-area {
          padding: 24px 32px;
          display: flex;
          align-items: flex-start;
          gap: 20px;
          border-bottom: 1px solid var(--glass-border, #E5E7EB);
          background: rgba(59, 130, 246, 0.02);
          border-radius: 16px 16px 0 0;
        }

        .security-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.1);
          color: #3B82F6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .security-header-text h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .security-header-text p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .settings-body.two-column-grid {
          padding: 32px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          .settings-body.two-column-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-action-footer {
            flex-direction: column;
            text-align: center;
          }
          
          .settings-action-footer .saas-btn-primary {
            width: 100%;
          }
        }

        .setting-mini-card {
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--glass-border, #E5E7EB);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .setting-mini-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }

        .setting-mini-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .setting-mini-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .setting-mini-icon.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
        }

        .setting-mini-icon.amber {
          background: rgba(245, 158, 11, 0.1);
          color: #F59E0B;
        }

        .setting-mini-title label {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .setting-mini-content {
          margin-bottom: 16px;
          flex-grow: 1;
        }

        .setting-mini-helper {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .settings-action-footer {
          padding: 24px 32px;
          border-top: 1px solid var(--glass-border, #E5E7EB);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(249, 250, 251, 0.5);
          border-radius: 0 0 16px 16px;
        }

        [data-theme="dark"] .settings-action-footer {
          background: rgba(17, 24, 39, 0.5);
        }

        .settings-action-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 13px;
        }

        .tooltip-icon {
          color: var(--text-muted);
          cursor: help;
        }

        .setting-description {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: var(--text-muted);
        }

        .saas-input {
          width: 100%;
          padding: 12px 16px;
          font-size: 15px;
          color: var(--text-primary);
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--glass-border, #E5E7EB);
          border-radius: 8px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        [data-theme="dark"] .saas-input {
          background: #111827;
          border-color: #374151;
        }

        .saas-input:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .custom-dropdown-container {
          position: relative;
        }

        .custom-dropdown-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .dropdown-arrow {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .custom-dropdown-list {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--glass-border, #E5E7EB);
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          z-index: 50;
          max-height: 250px;
          overflow-y: auto;
          padding: 8px;
          animation: dropIn 0.2s ease-out;
        }

        [data-theme="dark"] .custom-dropdown-list {
          background: #1F2937;
          border-color: #374151;
        }

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-dropdown-item {
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: var(--text-primary);
          transition: background 0.15s;
        }

        .custom-dropdown-item:hover {
          background: rgba(59, 130, 246, 0.05);
        }

        .custom-dropdown-item.selected {
          background: rgba(59, 130, 246, 0.1);
          color: #3B82F6;
          font-weight: 600;
        }

        /* 5. Footer & Save Button */
        .settings-footer {
          padding: 24px 32px;
          background: rgba(0,0,0,0.02);
          border-top: 1px solid var(--glass-border, #E5E7EB);
          display: flex;
          justify-content: flex-end;
        }

        [data-theme="dark"] .settings-footer {
          background: rgba(255,255,255,0.02);
        }

        .saas-btn-primary {
          background: #3B82F6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
        }

        .saas-btn-primary:hover:not(:disabled) {
          background: #2563EB;
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
        }

        .saas-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Toast Notifications */
        .toast-notification {
          position: fixed;
          top: 32px;
          right: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          z-index: 9999;
          font-weight: 600;
          font-size: 15px;
          animation: slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideInToast {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .toast-notification.success {
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .toast-notification.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }

        /* Loading & Error States */
        .loading-state, .error-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          text-align: center;
        }

        .loading-state {
          color: #3B82F6;
        }

        .loading-state p {
          margin-top: 16px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .error-card {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 16px;
          color: #DC2626;
        }

        [data-theme="dark"] .error-card {
          background: rgba(220, 38, 38, 0.1);
          border-color: rgba(220, 38, 38, 0.2);
        }

        .error-card p {
          margin: 16px 0 24px 0;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Merchant;
