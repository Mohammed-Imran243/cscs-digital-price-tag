// ─────────────────────────────────────────────────────────────────────────────
// 
//
// A reusable self-contained component.
// Drop it anywhere — currently used in PriceMonitor.tsx and PriceChangeMonitor.tsx.
// Shows current sync status and provides Start/Stop toggle.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getSyncStatus, startSync, stopSync } from '../../services/dashboardService';

// ── Status Badge Styles ──────────────────────────────────────────────────────
const badgeStyle = (running: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: running ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
  color: running ? '#16a34a' : '#dc2626',
  border: `1px solid ${running ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
});

const dotStyle = (running: boolean): React.CSSProperties => ({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: running ? '#16a34a' : '#dc2626',
  animation: running ? 'pulse 1.5s infinite' : 'none',
});

// ── Button Styles ────────────────────────────────────────────────────────────
const buttonStyle = (running: boolean, loading: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 18px',
  borderRadius: '8px',
  border: 'none',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: '14px',
  transition: 'all 0.2s ease',
  opacity: loading ? 0.65 : 1,
  backgroundColor: running ? 'var(--color-danger, #ef4444)' : 'var(--color-success, #22c55e)',
  color: '#ffffff',
});

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '14px 18px',
  borderRadius: '10px',
  backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.05))',
  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
};

// ── Component ────────────────────────────────────────────────────────────────
const SyncControlButton: React.FC = () => {
  const [running, setRunning]   = useState<boolean | null>(null); // null = loading
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<'start' | 'stop' | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch status on mount
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      if (status.success) {
        setRunning(status.running);
        setError('');
      } else {
        setRunning(false);
        setError(status.message || 'Could not check sync status.');
      }
    } catch {
      setRunning(false);
      setError('Could not reach sync service.');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Trigger Confirmation Modal
  const handleToggleClick = () => {
    if (running === null || loading) return;
    setPendingAction(running ? 'stop' : 'start');
    setShowConfirmModal(true);
  };

  // Execute Action upon Confirmation
  const handleConfirm = async () => {
    setShowConfirmModal(false);
    if (!pendingAction) return;

    setLoading(true);
    setMessage('');
    setError('');
    const actionToRun = pendingAction;
    setPendingAction(null);

    try {
      const result = actionToRun === 'stop' ? await stopSync() : await startSync();

      if (result.success) {
        setRunning(result.running);
        setMessage(result.message);
        showToast(`Sync ${actionToRun === 'stop' ? 'stopped' : 'started'} successfully!`, 'success');
      } else {
        const errorMsg = result.message || 'Action failed. Try again.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } catch {
      const errorMsg = 'Failed to connect to sync service.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Component styles block */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }

        @keyframes slideInToast {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .sync-toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 999999;
          font-weight: 500;
          animation: slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }

        .sync-toast-notification.success {
          border-left: 4px solid var(--success-color, #10b981);
          background: rgba(16, 185, 129, 0.15) !important;
          color: #10b981 !important;
          backdrop-filter: blur(8px);
        }

        .sync-toast-notification.error {
          border-left: 4px solid var(--danger-color, #ef4444);
          background: rgba(239, 68, 68, 0.15) !important;
          color: #ef4444 !important;
          backdrop-filter: blur(8px);
        }

        .sync-confirm-btn-stop {
          background-color: var(--danger-color, #ef4444) !important;
          border-color: var(--danger-color, #ef4444) !important;
          color: #ffffff !important;
        }

        .sync-confirm-btn-stop:hover {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
        }

        .sync-confirm-btn-start {
          background-color: var(--success-color, #22c55e) !important;
          border-color: var(--success-color, #22c55e) !important;
          color: #ffffff !important;
        }

        .sync-confirm-btn-start:hover {
          background-color: #16a34a !important;
          border-color: #16a34a !important;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3) !important;
        }
      `}</style>

      <div style={containerStyle}>
        {/* Label */}
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #e2e8f0)' }}>
          Price Sync
        </span>

        {/* Status Badge */}
        {running === null ? (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
            Checking...
          </span>
        ) : (
          <span style={badgeStyle(running)}>
            <span style={dotStyle(running)} />
            {running ? 'Running' : 'Stopped'}
          </span>
        )}

        {/* Toggle Button */}
        <button
          style={buttonStyle(!!running, loading || running === null)}
          onClick={handleToggleClick}
          disabled={loading || running === null}
          title={running ? 'Stop the price sync scheduler' : 'Start the price sync scheduler'}
        >
          {loading ? (
            <>
              <span style={{ fontSize: '12px' }}>⏳</span>
              {running ? 'Stopping...' : 'Starting...'}
            </>
          ) : (
            <>
              <span style={{ fontSize: '14px' }}>{running ? '⏹' : '▶'}</span>
              {running ? 'Stop Sync' : 'Start Sync'}
            </>
          )}
        </button>

        {/* Feedback Messages */}
        {message && (
          <span style={{ fontSize: '12px', color: 'var(--color-success, #22c55e)' }}>
            ✓ {message}
          </span>
        )}
        {error && (
          <span style={{ fontSize: '12px', color: 'var(--color-danger, #ef4444)' }}>
            ✗ {error}
          </span>
        )}
      </div>

      {/* Dynamic Toast Popup via Portal (Top Right Corner, matching global design) */}
      {toast && createPortal(
        <div className={`sync-toast-notification ${toast.type} glass-card`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} style={{ color: '#10b981' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          )}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}

      {/* Custom Confirmation Modal via Portal (Centered, matching global theme modal overlay) */}
      {showConfirmModal && createPortal(
        <div className="modal-overlay confirm-dialog-overlay" style={{ zIndex: 999999 }}>
          <div className="modal-content confirm-dialog glass-card" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '12px' }}>
              Confirm Sync Action / تأكيد عملية المزامنة
            </h3>
            <p style={{ lineHeight: 1.5, marginBottom: '24px' }}>
              {pendingAction === 'stop' ? (
                <>
                  Are you sure you want to <strong>stop</strong> the price sync scheduler? This will halt real-time price updates for digital shelf tags.
                  <span dir="rtl" style={{ display: 'block', marginTop: '8px', textAlign: 'right' }}>
                    هل أنت متأكد من أنك تريد <strong>إيقاف</strong> مجدول مزامنة الأسعار؟ سيؤدي هذا إلى إيقاف تحديثات الأسعار في الوقت الفعلي للبطاقات الرقمية.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to <strong>start</strong> the price sync scheduler? This will enable real-time price updates for digital shelf tags.
                  <span dir="rtl" style={{ display: 'block', marginTop: '8px', textAlign: 'right' }}>
                    هل أنت متأكد من أنك تريد <strong>بدء</strong> مجدول مزامنة الأسعار؟ سيؤدي هذا إلى تفعيل تحديثات الأسعار في الوقت الفعلي للبطاقات الرقمية.
                  </span>
                </>
              )}
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancel}
              >
                Cancel / إلغاء
              </button>
              <button 
                type="button" 
                className={`btn-primary ${pendingAction === 'stop' ? 'sync-confirm-btn-stop' : 'sync-confirm-btn-start'}`}
                onClick={handleConfirm}
              >
                Confirm / تأكيد
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SyncControlButton;