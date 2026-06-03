import React, { useState, useRef } from 'react';
import type { ImportResponse } from '../services/importExportService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityName: string;
  storeId?: string;
  onImport: (file: File, storeId?: string) => Promise<ImportResponse>;
  onExport: (storeId?: string) => Promise<void>;
  onDownloadTemplate: () => Promise<void>;
  acceptFormat?: string; // e.g. '.xlsx,.csv' or '.zip'
  showStoreSelector?: boolean;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  title,
  entityName,
  storeId,
  onImport,
  onExport,
  onDownloadTemplate,
  acceptFormat = '.xlsx,.csv',
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImportResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const result = await onImport(selectedFile, storeId);
      setImportResult(result);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await onExport(storeId);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setError(null);
    try {
      await onDownloadTemplate();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(error.response?.data?.message || error.message || 'Download failed');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
    setActiveTab('import');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>📦</span>
            <div>
              <h2 style={styles.title}>{title}</h2>
              <p style={styles.subtitle}>Bulk import/export {entityName}</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(activeTab === 'import' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('import')}
          >
            ⬆ Import
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === 'export' ? styles.activeTab : {}) }}
            onClick={() => setActiveTab('export')}
          >
            ⬇ Export
          </button>
        </div>

        <div style={styles.body}>
          {activeTab === 'import' && (
            <div>
              {/* Template Download */}
              <div style={styles.templateBanner}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  New to importing? Start with our template file.
                </span>
                <button
                  style={styles.templateBtn}
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? '⏳ Downloading...' : '📄 Download Template'}
                </button>
              </div>

              {/* Drop Zone */}
              <div
                style={{
                  ...styles.dropZone,
                  ...(dragOver ? styles.dropZoneActive : {}),
                  ...(selectedFile ? styles.dropZoneSelected : {}),
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptFormat}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {selectedFile ? (
                  <div style={styles.fileInfo}>
                    <span style={styles.fileIcon}>📊</span>
                    <div>
                      <div style={styles.fileName}>{selectedFile.name}</div>
                      <div style={styles.fileSize}>
                        {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.dropHint}>
                    <span style={styles.dropIcon}>☁️</span>
                    <div style={styles.dropText}>
                      Drag & drop your file here, or <span style={styles.browseLink}>browse</span>
                    </div>
                    <div style={styles.dropSubtext}>Supported: {acceptFormat}</div>
                  </div>
                )}
              </div>

              {/* Import Button */}
              <button
                style={{
                  ...styles.primaryBtn,
                  ...(!selectedFile || importing ? styles.primaryBtnDisabled : {}),
                }}
                onClick={handleImport}
                disabled={!selectedFile || importing}
              >
                {importing ? '⏳ Importing...' : '⬆ Start Import'}
              </button>

              {/* Error */}
              {error && (
                <div style={styles.errorBanner}>
                  <span>⚠️ {error}</span>
                </div>
              )}

              {/* Result */}
              {importResult && (
                <div style={importResult.success ? styles.successBanner : styles.errorBanner}>
                  <div style={styles.resultHeader}>
                    <span>{importResult.success ? '✅' : '⚠️'} {importResult.message}</span>
                  </div>
                  <div style={styles.resultStats}>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Total</span>
                      <span style={styles.statValue}>{importResult.totalRecords}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Succeeded</span>
                      <span style={{ ...styles.statValue, color: '#22c55e' }}>{importResult.successCount}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Failed</span>
                      <span style={{ ...styles.statValue, color: '#ef4444' }}>{importResult.failedCount}</span>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div style={styles.errorList}>
                      <div style={styles.errorListTitle}>Row Errors:</div>
                      {importResult.errors.slice(0, 20).map((err, i) => (
                        <div key={i} style={styles.errorRow}>
                          <span style={styles.errorRowNum}>Row {err.rowNumber}</span>
                          <span style={styles.errorRowField}>[{err.field}]</span>
                          <span style={styles.errorRowMsg}>{err.message}</span>
                        </div>
                      ))}
                      {importResult.errors.length > 20 && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          ...and {importResult.errors.length - 20} more errors.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div style={styles.exportSection}>
              <div style={styles.exportIcon}>⬇</div>
              <h3 style={styles.exportTitle}>Export {entityName}</h3>
              <p style={styles.exportDesc}>
                Download all {entityName.toLowerCase()} data as an Excel file.
                {storeId ? ` Filtered to the currently selected store.` : ' All stores will be included.'}
              </p>
              <button
                style={{ ...styles.primaryBtn, ...(exporting ? styles.primaryBtnDisabled : {}) }}
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? '⏳ Exporting...' : `⬇ Export ${entityName} to Excel`}
              </button>
              {error && (
                <div style={styles.errorBanner}>
                  <span>⚠️ {error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #1e293b',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    fontSize: '24px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#64748b',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #1e293b',
    padding: '0 24px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '12px 16px',
    marginBottom: '-1px',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#6366f1',
    borderBottomColor: '#6366f1',
  },
  body: {
    padding: '24px',
  },
  templateBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1e293b',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  templateBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  },
  dropZone: {
    border: '2px dashed #334155',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px',
  },
  dropZoneActive: {
    borderColor: '#6366f1',
    background: 'rgba(99,102,241,0.05)',
  },
  dropZoneSelected: {
    borderColor: '#22c55e',
    background: 'rgba(34,197,94,0.05)',
  },
  dropHint: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  dropIcon: {
    fontSize: '36px',
  },
  dropText: {
    color: '#94a3b8',
    fontSize: '15px',
  },
  browseLink: {
    color: '#6366f1',
    textDecoration: 'underline',
  },
  dropSubtext: {
    color: '#475569',
    fontSize: '12px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
  },
  fileIcon: {
    fontSize: '32px',
  },
  fileName: {
    color: '#f1f5f9',
    fontWeight: 600,
    fontSize: '14px',
  },
  fileSize: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '2px',
  },
  primaryBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '13px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorBanner: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginTop: '14px',
    color: '#fca5a5',
    fontSize: '14px',
  },
  successBanner: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginTop: '14px',
    color: '#86efac',
    fontSize: '14px',
  },
  resultHeader: {
    marginBottom: '10px',
    fontWeight: 600,
  },
  resultStats: {
    display: 'flex',
    gap: '24px',
    marginBottom: '10px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#f1f5f9',
  },
  errorList: {
    borderTop: '1px solid rgba(239,68,68,0.2)',
    paddingTop: '10px',
    marginTop: '10px',
  },
  errorListTitle: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  errorRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  errorRowNum: {
    color: '#fbbf24',
    fontWeight: 600,
  },
  errorRowField: {
    color: '#94a3b8',
  },
  errorRowMsg: {
    color: '#fca5a5',
  },
  exportSection: {
    textAlign: 'center',
    padding: '16px 0',
  },
  exportIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  exportTitle: {
    color: '#f1f5f9',
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  exportDesc: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
};

export default ImportExportModal;
