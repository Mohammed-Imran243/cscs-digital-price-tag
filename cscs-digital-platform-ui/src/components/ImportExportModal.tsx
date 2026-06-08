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
  hideExport?: boolean;
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
  showStoreSelector = false,
  hideExport = false,
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

  React.useEffect(() => {
    if (isOpen) {
      const activeEl = document.activeElement;
      if (activeEl) {
        const text = activeEl.textContent || '';
        const className = activeEl.className || '';
        if (
          className.includes('export') || 
          text.toLowerCase().includes('export') || 
          text.includes('تصدير')
        ) {
          setActiveTab('export');
        } else {
          setActiveTab('import');
        }
      }
    }
  }, [isOpen]);

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

  const displayEntity = entityName === 'ESL Tags' ? 'Devices' : entityName;
  const arabicEntityMap: Record<string, string> = {
    'Stores': 'المتاجر',
    'Products': 'المنتجات',
    'Devices': 'الأجهزة',
    'ESL Tags': 'الأجهزة',
    'Templates': 'القوالب'
  };
  const arabicEntity = arabicEntityMap[entityName] || displayEntity;

  const displayTitle = activeTab === 'import' 
    ? `${displayEntity} Import / استيراد ${arabicEntity}` 
    : `${displayEntity} Export / تصدير ${arabicEntity}`;
  const displaySubtitle = activeTab === 'import' 
    ? `Bulk import ${entityName} / استيراد ${arabicEntity} بالجملة` 
    : `Bulk export ${entityName} / تصدير ${arabicEntity} بالجملة`;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>📦</span>
            <div>
              <h2 style={styles.title}>{displayTitle}</h2>
              <p style={styles.subtitle}>{displaySubtitle}</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div style={styles.body}>
          {activeTab === 'import' && (
            <div>
              {/* Template Download */}
              <div style={styles.templateBanner}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  New to importing? Start with our template file. / هل أنت جديد؟ ابدأ بملف القالب
                </span>
                <button
                  style={styles.templateBtn}
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? '⏳ Downloading... / جاري التحميل...' : '📄 Download Template / تحميل القالب'}
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
                        {(selectedFile.size / 1024).toFixed(1)} KB · Click to change / انقر للتغيير
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.dropHint}>
                    <span style={styles.dropIcon}>☁️</span>
                    <div style={styles.dropText}>
                      Drag & drop your file here, or <span style={styles.browseLink}>browse</span> / اسحب وأفلت ملفك هنا، أو <span style={styles.browseLink}>تصفح</span>
                    </div>
                    <div style={styles.dropSubtext}>Supported: {acceptFormat} / المدعوم: {acceptFormat}</div>
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
                {importing ? '⏳ Importing... / جاري الاستيراد...' : '⬆ Start Import / بدء الاستيراد'}
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
                      <span style={{ ...styles.statValue, color: 'var(--success-color)' }}>{importResult.successCount}</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={styles.statLabel}>Failed</span>
                      <span style={{ ...styles.statValue, color: 'var(--danger-color)' }}>{importResult.failedCount}</span>
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
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
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
              <h3 style={styles.exportTitle}>Export {entityName} / تصدير {arabicEntity}</h3>
              <p style={styles.exportDesc}>
                Download all {entityName.toLowerCase()} data as an Excel file. / قم بتنزيل جميع بيانات {arabicEntity} كملف إكسل.
                {storeId ? ` Filtered to the currently selected store. / تمت تصفيتها للمتجر المحدد حاليًا.` : ' All stores will be included. / سيتم تضمين جميع الفروع.'}
              </p>
              <button
                style={{ ...styles.primaryBtn, ...(exporting ? styles.primaryBtnDisabled : {}) }}
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? '⏳ Exporting... / جاري التصدير...' : '⬇ Start Export / بدء التصدير'}
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
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modal: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: 'var(--shadow-md)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border-color)',
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
    color: 'var(--text-primary)',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid var(--border-color)',
    padding: '0 24px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '12px 16px',
    marginBottom: '-1px',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: 'var(--primary-color)',
    borderBottomColor: 'var(--primary-color)',
  },
  body: {
    padding: '24px',
  },
  templateBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-primary)',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  templateBtn: {
    background: 'transparent',
    border: '1px solid var(--success-color)',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  },
  dropZone: {
    border: '2px dashed var(--border-color)',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '16px',
  },
  dropZoneActive: {
    borderColor: 'var(--primary-color)',
    background: 'rgba(59,130,246,0.05)',
  },
  dropZoneSelected: {
    borderColor: 'var(--success-color)',
    background: 'rgba(16,185,129,0.05)',
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
    color: 'var(--text-secondary)',
    fontSize: '15px',
  },
  browseLink: {
    color: 'var(--primary-color)',
    textDecoration: 'underline',
  },
  dropSubtext: {
    color: 'var(--text-muted)',
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
    color: 'var(--text-primary)',
    fontWeight: 600,
    fontSize: '14px',
  },
  fileSize: {
    color: 'var(--text-secondary)',
    fontSize: '12px',
    marginTop: '2px',
  },
  primaryBtn: {
    width: '100%',
    background: 'var(--primary-color)',
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
    color: 'var(--danger-color)',
    fontSize: '14px',
  },
  successBanner: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginTop: '14px',
    color: 'var(--success-color)',
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
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  errorList: {
    borderTop: '1px solid rgba(239,68,68,0.2)',
    paddingTop: '10px',
    marginTop: '10px',
  },
  errorListTitle: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
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
    color: 'var(--warning-color)',
    fontWeight: 600,
  },
  errorRowField: {
    color: 'var(--text-secondary)',
  },
  errorRowMsg: {
    color: 'var(--danger-color)',
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
    color: 'var(--text-primary)',
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 8px',
  },
  exportDesc: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
};

export default ImportExportModal;
