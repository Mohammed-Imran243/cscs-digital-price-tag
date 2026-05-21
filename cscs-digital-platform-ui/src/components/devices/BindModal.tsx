import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Store } from '../../services/storeService';
import { deviceService } from '../../services/deviceService';

interface BindModalProps {
  bindModalOpen: boolean;
  setBindModalOpen: (open: boolean) => void;
  stores: Store[];
  bindLoading: boolean;
  bindFormStoreId: string;
  setBindFormStoreId: (storeId: string) => void;
  bindFormItemBarCode: string;
  setBindFormItemBarCode: (barcode: string) => void;
  bindFormEslBarcode: string;
  setBindFormEslBarcode: (barcode: string) => void;
  bindFormApMac: string;
  setBindFormApMac: (mac: string) => void;
  availableEsls: any[];
  setAvailableEsls: (esls: any[]) => void;
  availableAps: any[];
  setAvailableAps: (aps: any[]) => void;
  bindTab: 'bind' | 'unbind';
  setBindTab: (tab: 'bind' | 'unbind') => void;
  unbindBarcodes: string;
  setUnbindBarcodes: (barcodes: string) => void;
  selectedBarcodes: string[];
  handleBind: () => void;
  handleUnbind: () => void;
}

export const BindModal: React.FC<BindModalProps> = ({
  bindModalOpen,
  setBindModalOpen,
  stores,
  bindLoading,
  bindFormStoreId,
  setBindFormStoreId,
  bindFormItemBarCode,
  setBindFormItemBarCode,
  bindFormEslBarcode,
  setBindFormEslBarcode,
  bindFormApMac,
  setBindFormApMac,
  availableEsls,
  setAvailableEsls,
  availableAps,
  setAvailableAps,
  bindTab,
  setBindTab,
  unbindBarcodes,
  setUnbindBarcodes,
  selectedBarcodes,
  handleBind,
  handleUnbind,
}) => {
  if (!bindModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setBindModalOpen(false)}>
      <div className="modal-content glass-card bind-workflow-modal scale-up" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h3>
            {bindTab === 'bind' ? 'Bind' : 'Unbind'}
          </h3>
          <button className="close-btn" onClick={() => setBindModalOpen(false)}>&times;</button>
        </div>

        {/* Bind / Unbind tab switcher */}
        <div className="bind-tab-row">
          <button
            className={`bind-tab-btn ${bindTab === 'bind' ? 'active' : ''}`}
            onClick={() => setBindTab('bind')}
          >
            Bind
          </button>
          <button
            className={`bind-tab-btn ${bindTab === 'unbind' ? 'active' : ''}`}
            onClick={() => setBindTab('unbind')}
          >
            Unbind
          </button>
        </div>

        {/* ── BIND FORM ── */}
        {bindTab === 'bind' && (
          <div className="bind-form-body">

            {/* Store Select */}
            <div className="bind-field-group">
              <label className="bind-field-label">Store Select</label>
              <select
                className="bind-select"
                value={bindFormStoreId}
                onChange={e => {
                  const newStoreId = e.target.value;
                  setBindFormStoreId(newStoreId);
                  setAvailableEsls([]);
                  setAvailableAps([]);
                  setBindFormEslBarcode('');
                  setBindFormApMac('');
                  // Reload lists for new store
                  deviceService.getAvailableEslDevices(newStoreId)
                    .then(r => setAvailableEsls(r || []))
                    .catch(() => {});
                  deviceService.getApDevices(0, 200, newStoreId, '')
                    .then(r => setAvailableAps(r?.content || []))
                    .catch(() => {});
                }}
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                ))}
              </select>
            </div>

            {/* Item Barcode */}
            <div className="bind-field-group">
              <label className="bind-field-label">Item Barcode <span className="req">*</span></label>
              <input
                className="bind-input"
                type="text"
                placeholder="e.g. 1010117A003"
                value={bindFormItemBarCode}
                onChange={e => setBindFormItemBarCode(e.target.value)}
              />
            </div>

            {/* ESL Barcode */}
            <div className="bind-field-group">
              <label className="bind-field-label">ESL Barcode <span className="req">*</span></label>
              <div className="bind-input-with-hint">
                <input
                  className="bind-input"
                  type="text"
                  placeholder="e.g. 811952808"
                  value={bindFormEslBarcode}
                  onChange={e => setBindFormEslBarcode(e.target.value)}
                  list="available-esl-list"
                />
                <datalist id="available-esl-list">
                  {availableEsls.map(e => (
                    <option key={e.priceTagCode} value={e.priceTagCode}>
                      {e.priceTagCode} ({e.oemModel || 'N/A'}) — {e.state}
                    </option>
                  ))}
                </datalist>
              </div>
              {availableEsls.length > 0 && (
                <span className="bind-hint">{availableEsls.length} unbound ESL(s) available</span>
              )}
            </div>

            {/* AP MAC */}
            <div className="bind-field-group">
              <label className="bind-field-label">AP MAC (optional)</label>
              <div className="bind-input-with-hint">
                <input
                  className="bind-input"
                  type="text"
                  placeholder="e.g. AA:BB:CC:DD:EE:FF"
                  value={bindFormApMac}
                  onChange={e => setBindFormApMac(e.target.value)}
                  list="available-ap-list"
                />
                <datalist id="available-ap-list">
                  {availableAps.map(ap => (
                    <option key={ap.mac} value={ap.mac}>
                      {ap.apName || ap.mac} — {ap.online}
                    </option>
                  ))}
                </datalist>
              </div>
              {availableAps.length > 0 && (
                <div className="bind-ap-chips">
                  {availableAps.slice(0, 4).map(ap => (
                    <span
                      key={ap.mac}
                      className={`bind-ap-chip ${ap.online === 'ONLINE' ? 'online' : 'offline'} ${bindFormApMac === ap.mac ? 'selected' : ''}`}
                      onClick={() => setBindFormApMac(ap.mac)}
                      title={`${ap.apName} — ${ap.ip || 'N/A'} — ${ap.online}`}
                    >
                      <span className="ap-chip-dot" />
                      {ap.apName || ap.mac}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bind-form-note">
              After binding, the ESL label will display the product data and can be force-refreshed to sync immediately.
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={handleBind}
                disabled={bindLoading || !bindFormItemBarCode.trim() || !bindFormEslBarcode.trim()}
              >
                {bindLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Bind
              </button>
              <button className="btn-secondary" onClick={() => setBindModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── UNBIND FORM ── */}
        {bindTab === 'unbind' && (
          <div className="bind-form-body">

            {/* Store Select */}
            <div className="bind-field-group">
              <label className="bind-field-label">Store Select</label>
              <select
                className="bind-select"
                value={bindFormStoreId}
                onChange={e => setBindFormStoreId(e.target.value)}
              >
                {stores.map(s => (
                  <option key={s.storeId} value={s.storeId}>{s.storeName}</option>
                ))}
              </select>
            </div>

            {/* ESL Barcode(s) */}
            <div className="bind-field-group">
              <label className="bind-field-label">ESL Barcode(s) <span className="req">*</span></label>
              <textarea
                className="bind-textarea"
                rows={4}
                placeholder="Enter one or more ESL barcodes, separated by commas or new lines"
                value={unbindBarcodes}
                onChange={e => setUnbindBarcodes(e.target.value)}
              />
              <span className="bind-hint">You can also select from the table first — selected barcodes appear here.</span>
            </div>

            {/* Pre-fill from table selection */}
            {selectedBarcodes.length > 0 && (
              <button
                className="bind-prefill-btn"
                onClick={() => setUnbindBarcodes(selectedBarcodes.join('\n'))}
              >
                Use {selectedBarcodes.length} selected barcode(s) from table
              </button>
            )}

            <div className="bind-form-note">
              Unbinding releases the ESL label from its current product and returns it to the available pool.
            </div>

            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={handleUnbind}
                disabled={bindLoading || !unbindBarcodes.trim()}
              >
                {bindLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Unbind
              </button>
              <button className="btn-secondary" onClick={() => setBindModalOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
