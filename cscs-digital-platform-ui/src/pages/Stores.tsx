import React, { useState, useEffect } from 'react';
import { Plus, Search, Store as StoreIcon, Edit2, Trash2, MapPin, Phone, User, Mail, RefreshCw, Loader2, X, CheckCircle, Power } from 'lucide-react';
import { storeService } from '../services/storeService';
import type { Store } from '../services/storeService';
import { getPaginationRange } from '../utils/paginationUtils';

const Stores: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Custom alert/confirm / notification state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    address: '',
    contacts: '',
    phone: '',
    mailbox: '',
    externalStoreId: '',
    comment: '',
  });

  const fetchStores = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await storeService.getAllStores();
      setStores(response || []);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const filteredStores = stores.filter(store => {
    const searchLower = searchTerm.trim().toLowerCase();
    
    // If search box is empty, show all stores
    if (!searchLower) return true;

    // Only search/filter by Name, Internal ID, External ID, and Address
    return (
      (store.storeName || '').toLowerCase().includes(searchLower) ||
      (store.storeId || '').toString().includes(searchLower) ||
      (store.externalStoreId || '').toString().toLowerCase().includes(searchLower) ||
      (store.address || '').toLowerCase().includes(searchLower)
    );
  });

  const totalCount = filteredStores.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStores = filteredStores.slice(startIndex, startIndex + pageSize);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ storeName: '', address: '', contacts: '', phone: '', mailbox: '', externalStoreId: '', comment: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (store: Store) => {
    setIsEditing(true);
    setEditingId(store.storeId);
    setFormData({
      storeName: store.storeName || '',
      address: store.address || '',
      contacts: store.contacts || '',
      phone: store.phone || '',
      mailbox: store.mailbox || '',
      externalStoreId: store.externalStoreId || '',
      comment: store.comment || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditing && editingId) {
        await storeService.updateStore(editingId, formData);
        showNotification('Store updated successfully / تم تحديث المتجر بنجاح', 'success');
      } else {
        await storeService.addStore(formData);
        showNotification('Store added successfully / تمت إضافة المتجر بنجاح', 'success');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (err: any) {
      showNotification(`Failed to ${isEditing ? 'update' : 'add'} store. Please try again. / فشل ${isEditing ? 'تحديث' : 'إضافة'} المتجر. يرجى المحاولة مرة أخرى.`, 'error');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDisable = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Disable Store / تعطيل المتجر',
      message: 'Are you sure you want to disable this store? / هل أنت متأكد من رغبتك في تعطيل هذا المتجر؟',
      onConfirm: async () => {
        try {
          await storeService.disableStore(id);
          fetchStores();
          showNotification('Store disabled successfully / تم تعطيل المتجر بنجاح', 'success');
        } catch (err: any) {
          showNotification('Failed to disable store. Please try again. / فشل تعطيل المتجر. يرجى المحاولة مرة أخرى.', 'error');
          console.error(err);
        }
      }
    });
  };

  const handleEnable = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Enable Store / تفعيل المتجر',
      message: 'Are you sure you want to enable this store? / هل أنت متأكد من رغبتك في تفعيل هذا المتجر؟',
      onConfirm: async () => {
        try {
          await storeService.enableStore(id);
          fetchStores();
          showNotification('Store enabled successfully / تم تفعيل المتجر بنجاح', 'success');
        } catch (err: any) {
          showNotification('Failed to enable store. Please try again. / فشل تفعيل المتجر. يرجى المحاولة مرة أخرى.', 'error');
          console.error(err);
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store / حذف المتجر',
      message: 'Are you sure you want to delete this store? This will physically remove it from Dragon ESL. / هل أنت متأكد من رغبتك في حذف هذا المتجر؟ سيؤدي ذلك إلى إزالته نهائياً من Dragon ESL.',
      onConfirm: async () => {
        try {
          await storeService.deleteStore(id);
          fetchStores();
          showNotification('Store deleted successfully / تم حذف المتجر بنجاح', 'success');
        } catch (err: any) {
          showNotification('Failed to delete store. Please try again. / فشل حذف المتجر. يرجى المحاولة مرة أخرى.', 'error');
          console.error(err);
        }
      }
    });
  };

  return (
    <div className="stores-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification ${notification.type} glass-card`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog?.isOpen && (
        <div className="modal-overlay confirm-dialog-overlay">
          <div className="modal-content confirm-dialog glass-card">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel / إلغاء</button>
              <button className="btn-primary danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm / تأكيد</button>
            </div>
          </div>
        </div>
      )}

      <div className="stores-page-header">
        <div>
          <h2>Store Management / إدارة المتاجر</h2>
         </div>
        <div className="stores-header-actions">
          <button className="btn-secondary" onClick={fetchStores} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh / تحديث
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add Store / إضافة متجر
          </button>
        </div>
      </div>

      <div className="stores-search-bar glass-card">
        <Search size={20} className="text-muted" />
        <input
          type="text"
          placeholder="Search stores by name, ID, or address... / ابحث عن المتاجر بالاسم أو المعرف أو العنوان..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="stores-total-count">{filteredStores.length} Stores / متاجر</span>
      </div>

      {loading ? (
        <div className="stores-loading-state">
          <Loader2 className="animate-spin" size={40} />
          <p>Fetching store data from Dragon ESL... / جاري جلب بيانات المتاجر من Dragon ESL...</p>
        </div>
      ) : error ? (
        <div className="stores-error-state glass-card">
          <p>{error}</p>
          <button onClick={fetchStores} className="btn-primary">Try Again / أعد المحاولة</button>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="stores-empty-state glass-card">
          <StoreIcon size={48} />
          <h3>No Stores Found / لم يتم العثور على متاجر</h3>
          <p>Start by adding your first store location. / ابدأ بإضافة موقع متجرك الأول.</p>
          <button className="btn-primary" onClick={openCreateModal}>Add Store / إضافة متجر</button>
        </div>
      ) : (
        <>
          <div className="stores-grid">
            {paginatedStores.map(store => (
              <div key={store.storeId} className="store-card glass-card">
                <div className="store-card-header">
                  <div className="store-icon-wrapper">
                    <StoreIcon size={24} />
                  </div>
                  <div className={`store-badge ${store.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                    {store.status === 'ACTIVE' ? 'Active / نشط' : (store.status === 'INACTIVE' ? 'Inactive / غير نشط' : store.status || 'UNKNOWN / غير معروف')}
                  </div>
                </div>

                <div className="store-card-body">
                  <h3>{store.storeName}</h3>
                  <p className="store-id">
                    <span style={{ userSelect: 'none' }}>ID / المعرف: </span>
                    <strong style={{ userSelect: 'all' }}>{store.storeId}</strong>
                  </p>
                  {store.externalStoreId && (
                    <p className="store-id">
                      <span style={{ userSelect: 'none' }}>Ext ID / المعرف الخارجي: </span>
                      <strong style={{ userSelect: 'all' }}>{store.externalStoreId}</strong>
                    </p>
                  )}

                  <div className="store-info-list">
                    <div className="store-info-item">
                      <MapPin size={16} />
                      <span>{store.address || 'No address provided / لم يتم تقديم عنوان'}</span>
                    </div>
                    <div className="store-info-item">
                      <User size={16} />
                      <span>{store.contacts || 'No contact assigned / لم يتم تعيين مسؤول'}</span>
                    </div>
                    <div className="store-info-item">
                      <Phone size={16} />
                      <span>{store.phone || 'N/A / غير متوفر'}</span>
                    </div>
                    <div className="store-info-item">
                      <Mail size={16} />
                      <span>{store.mailbox || 'N/A / غير متوفر'}</span>
                    </div>
                  </div>
                </div>

                <div className="store-card-actions">
                  <button className="btn-text edit-btn" onClick={() => openEditModal(store)}>
                    <Edit2 size={16} />
                    <span>Edit / تعديل</span>
                  </button>
                  {store.status === 'ACTIVE' ? (
                    <button className="btn-text disable-btn" onClick={() => store.storeId && handleDisable(store.storeId)}>
                      <Power size={16} />
                      <span>Disable / تعطيل</span>
                    </button>
                  ) : (
                    <button className="btn-text enable-btn" onClick={() => store.storeId && handleEnable(store.storeId)}>
                      <CheckCircle size={16} />
                      <span>Enable / تفعيل</span>
                    </button>
                  )}
                  <button className="btn-text delete-btn" onClick={() => store.storeId && handleDelete(store.storeId)}>
                    <Trash2 size={16} />
                    <span>Delete / حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Premium Zkong/DragonESL Pagination */}
          {totalCount > 0 && (
            <div className="dragonesl-pagination-bar glass-card">
              <div className="pagination-left">
                <span className="pagination-total">Total {totalCount} items / الإجمالي {totalCount} عناصر</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="pagination-size-select"
                >
                  <option value={5}>5 / page / ٥ للصفحة</option>
                  <option value={10}>10 / page / ١٠ للصفحة</option>
                  <option value={20}>20 / page / ٢٠ للصفحة</option>
                  <option value={50}>50 / page / ٥٠ للصفحة</option>
                  <option value={100}>100 / page / ١٠٠ للصفحة</option>
                </select>
              </div>

              <div className="pagination-right">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="pagination-arrow-btn"
                >
                  &lt;
                </button>

                {getPaginationRange(currentPage, totalPages, 1).map((pageNum, idx) => (
                  pageNum === '...' ? (
                    <span key={`dots-${idx}`} className="pagination-dots">...</span>
                  ) : (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(Number(pageNum))}
                      className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="pagination-arrow-btn"
                >
                  &gt;
                </button>

                <div className="pagination-jump">
                  <span>Go to / الذهاب إلى</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      }
                    }}
                    className="pagination-jump-input"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Store / تعديل المتجر' : 'Create New Store / إنشاء متجر جديد'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="store-form">
              <div className="form-group">
                <label>Store Name <span className="required-asterisk">*</span> / اسم المتجر <span className="required-asterisk">*</span></label>
                <input required type="text" value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  className="glass-input" placeholder="e.g. Al Naseem Store / مثل متجر النسيم" />
              </div>
              <div className="form-group">
                <label>External Store ID / معرف المتجر الخارجي</label>
                <input type="text" value={formData.externalStoreId}
                  onChange={e => setFormData({ ...formData, externalStoreId: e.target.value })}
                  className="glass-input" placeholder="ERP Store Code / رمز المتجر في نظام ERP" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person / الشخص المسؤول</label>
                  <input type="text" value={formData.contacts}
                    onChange={e => setFormData({ ...formData, contacts: e.target.value })}
                    className="glass-input" placeholder="Manager name / اسم المدير" />
                </div>
                <div className="form-group">
                  <label>Phone / رقم الهاتف</label>
                  <input type="text" value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="glass-input" placeholder="+966... / ٠٠٩٦٦..." />
                </div>
              </div>
              <div className="form-group">
                <label>Email / البريد الإلكتروني</label>
                <input type="email" value={formData.mailbox}
                  onChange={e => setFormData({ ...formData, mailbox: e.target.value })}
                  className="glass-input" placeholder="store@example.com" />
              </div>
              <div className="form-group">
                <label>Address / العنوان</label>
                <textarea value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="glass-input" rows={3} placeholder="Full store address / العنوان الكامل للمتجر" />
              </div>
              <div className="form-group">
                <label>Comment / ملاحظات</label>
                <textarea value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                  className="glass-input" rows={2} placeholder="Additional notes / ملاحظات إضافية" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel / إلغاء</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditing ? 'Update Store / تحديث المتجر' : 'Create Store / إنشاء متجر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .required-asterisk {
          color: #ef4444;
          margin-left: 2px;
        }

        .stores-container {
          padding: 24px;
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

        .toast-notification.warning {
          border-left: 4px solid var(--warning-color);
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .confirm-dialog {
          max-width: 400px !important;
        }

        .confirm-dialog h3 {
          margin-bottom: 12px;
          color: var(--text-primary);
        }

        .confirm-dialog p {
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .stores-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .stores-page-header h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .stores-header-actions {
          display: flex;
          gap: 12px;
        }

        .stores-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          margin-bottom: 32px;
        }

        .stores-search-bar input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
        }

        .stores-total-count {
          font-size: 13px;
          color: var(--text-muted);
          white-space: nowrap;
          font-weight: 600;
        }

        .stores-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .store-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .store-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .store-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .store-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .store-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-active {
          background: rgba(16, 185, 129, 0.15);
          color: var(--success-color);
        }

        .status-inactive {
          background: rgba(148, 163, 184, 0.15);
          color: var(--text-muted);
        }

        .store-card-body h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .store-id {
          font-size: 12px;
          color: var(--text-muted);
          font-family: monospace;
          margin-bottom: 4px;
        }

        .store-info-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .store-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .store-info-item svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .store-card-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .btn-text {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .btn-text:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .btn-text.edit-btn {
          color: var(--primary-color);
        }
        .btn-text.edit-btn:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .btn-text.disable-btn {
          color: #f59e0b;
        }
        .btn-text.disable-btn:hover {
          background: rgba(245, 158, 11, 0.1);
        }

        .btn-text.enable-btn {
          color: var(--success-color);
        }
        .btn-text.enable-btn:hover {
          background: rgba(16, 185, 129, 0.1);
        }

        .btn-text.delete-btn {
          color: var(--danger-color);
        }
        .btn-text.delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 520px;
          padding: 32px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .store-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .glass-input {
          background-color: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 14px;
        }

        .glass-input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-secondary {
          background: rgba(148, 163, 184, 0.2);
          color: var(--text-primary);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .stores-loading-state, .stores-error-state, .stores-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
          color: var(--text-muted);
          gap: 16px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .pagination-dots {
          color: var(--text-muted);
          padding: 8px 12px;
          display: flex;
          align-items: center;
        }

        @media (max-width: 768px) {
          .stores-page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .stores-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            flex-direction: column;
          }
          .stores-search-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .stores-header-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default Stores;
