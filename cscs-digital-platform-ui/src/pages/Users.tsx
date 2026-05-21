import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, User as UserIcon, Edit2, Trash2, Key, Calendar, RefreshCw, Loader2, X, CheckSquare, Square, Info } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role } from '../services/userService';
import { getPaginationRange } from '../utils/paginationUtils';

const AVAILABLE_PERMISSIONS = [
  { id: 135, name: 'Product Management', code: 'product' },
  { id: 138, name: 'Store Management', code: 'store' },
  { id: 133, name: 'ESL Device Management', code: 'equipment' },
  { id: 141, name: 'Role & System Settings', code: 'system' },
  { id: 134, name: 'ESL & System Logs', code: 'log' },
  { id: 139, name: 'Staff User Management', code: 'staffManager' },
  { id: 136, name: 'Display Templates', code: 'template' },
  { id: 311, name: 'System Alarm Alerts', code: 'alarm' },
  { id: 309, name: 'Dashboard Statistics', code: 'statistics' },
  { id: 224, name: 'Material Assets', code: 'material' },
];

const Users: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data lists
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // Search
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
    }, 4500);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Modals & Forms
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // User Form
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    account: '',
    staffName: '',
    password: '',
    roleId: '',
  });

  // Role Form
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | number | null>(null);
  const [roleFormData, setRoleFormData] = useState<{
    roleName: string;
    menuIdList: number[];
  }>({
    roleName: '',
    menuIdList: [],
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const usersRes = await userService.listUsers(1, 100);
        const rawData = usersRes;
        const userList = rawData?.userVos || rawData?.userRoleStoreList || (Array.isArray(rawData) ? rawData : (rawData?.list || []));
        
        const mappedUsers = userList.map((item: any) => {
          const u = item.user || item;
          return {
            id: u.id,
            account: u.account,
            staffName: u.name || u.staffName || 'Unnamed Staff',
            roleId: u.roleId,
            roleName: item.roleName || u.roleName || 'No Role Assigned',
            createTime: u.createTime,
            status: u.enable === 1 ? 'Normal' : 'Disabled',
          };
        });
        setUsers(mappedUsers);
      } else {
        const rolesRes = await userService.listRoles(1, 100);
        const rawData = rolesRes;
        const rolesList = Array.isArray(rawData) ? rawData : (rawData?.list || []);
        
        const mappedRoles = rolesList.map((r: any) => ({
          id: r.id,
          roleName: r.roleName || r.name || 'Unnamed Role',
          merchantId: r.merchantId || '1775639851383',
          createTime: r.createTime || 'Shared',
        }));
        setRoles(mappedRoles);
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to ESL server. Please check middleware API status.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Pre-load roles list when user modal is opened
  const loadRolesDropdown = async () => {
    try {
      const rolesRes = await userService.listRoles(1, 100);
      const rawData = rolesRes;
      const rolesList = Array.isArray(rawData) ? rawData : (rawData?.list || []);
      const mappedRoles = rolesList.map((r: any) => ({
        id: r.id,
        roleName: r.roleName || r.name || 'Unnamed Role',
        merchantId: r.merchantId || '1775639851383',
        createTime: r.createTime || 'Shared',
      }));
      setRoles(mappedRoles);
    } catch (err) {
      console.error('Failed to load roles for dropdown', err);
    }
  };

  // User Actions
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserFormData({ account: '', staffName: '', password: '', roleId: '' });
    loadRolesDropdown();
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setIsEditingUser(true);
    setEditingUserId(user.id || null);
    setUserFormData({
      account: user.account || '',
      staffName: user.staffName || '',
      password: '', // Password empty by default for edit
      roleId: user.roleId?.toString() || '',
    });
    loadRolesDropdown();
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload: any = {
        account: userFormData.account,
        staffName: userFormData.staffName,
        roleId: Number(userFormData.roleId),
      };
      
      if (userFormData.password) {
        payload.password = userFormData.password;
      }

      if (isEditingUser && editingUserId) {
        await userService.updateUser(editingUserId, payload);
        showNotification('User updated successfully!', 'success');
      } else {
        if (!userFormData.password) {
          showNotification('Password is required for new users', 'error');
          setFormLoading(false);
          return;
        }
        await userService.addUser(payload);
        showNotification('User created successfully!', 'success');
      }
      
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || `Failed to ${isEditingUser ? 'update' : 'create'} user`, 'error');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUserDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: 'Are you sure you want to delete this user?',
      onConfirm: async () => {
        try {
          await userService.deleteUser(id);
          fetchData();
          showNotification('User deleted successfully.', 'success');
        } catch (err: any) {
          showNotification(err.message || 'Failed to delete user', 'error');
          console.error(err);
        }
      }
    });
  };

  // Role Actions
  const handleOpenCreateRole = () => {
    setIsEditingRole(false);
    setEditingRoleId(null);
    setRoleFormData({ roleName: '', menuIdList: [] });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = async (role: Role) => {
    setIsEditingRole(true);
    setEditingRoleId(role.id || null);
    
    // Fetch detailed permissions for this role
    try {
      const permissionsData = await userService.getPermissions(role.id);
      const activeIds = (permissionsData?.list || []).map((m: any) => m.id);
      setRoleFormData({
        roleName: role.roleName || '',
        menuIdList: activeIds,
      });
    } catch (err) {
      setRoleFormData({
        roleName: role.roleName || '',
        menuIdList: role.menuIdList || [],
      });
    }
    
    setIsRoleModalOpen(true);
  };

  const handleTogglePermission = (id: number) => {
    setRoleFormData(prev => {
      const alreadyChecked = prev.menuIdList.includes(id);
      return {
        ...prev,
        menuIdList: alreadyChecked
          ? prev.menuIdList.filter(permId => permId !== id)
          : [...prev.menuIdList, id]
      };
    });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditingRole && editingRoleId) {
        await userService.updateRole(editingRoleId, roleFormData);
        showNotification('Role updated successfully!', 'success');
      } else {
        await userService.addRole(roleFormData);
        showNotification('Role created successfully!', 'success');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(err.message || `Failed to ${isEditingRole ? 'update' : 'create'} role`, 'error');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleDelete = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Role',
      message: 'Are you sure you want to delete this role? This cannot be undone.',
      onConfirm: async () => {
        try {
          await userService.deleteRole(id);
          fetchData();
          showNotification('Role deleted successfully.', 'success');
        } catch (err: any) {
          showNotification(err.message || 'Failed to delete role. Ensure no users are assigned to this role.', 'error');
          console.error(err);
        }
      }
    });
  };

  // Filters
  const filteredUsers = users.filter(user =>
    (user.account || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.staffName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.roleName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const filteredRoles = roles.filter(role =>
    (role.roleName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page-container">
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
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="btn-primary danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="users-header">
        <div>
          <h2>Staff User Management</h2>
          <p className="text-muted">Manage staff accounts and system operators</p>
        </div>
        <div className="users-header-actions">
          <button className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {activeTab === 'users' ? (
            <button className="btn-primary" onClick={handleOpenCreateUser}>
              <Plus size={18} /> Create User
            </button>
          ) : (
            <button className="btn-primary" onClick={handleOpenCreateRole}>
              <Plus size={18} /> Create Role
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="users-tabs-navigation glass-card" style={{ justifyContent: 'space-between' }}>
        <div className="tabs-list">
          <button
            className={`tab-trigger ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSearchTerm('');
            }}
          >
            <UserIcon size={16} />
            <span>Staff Users</span>
          </button>
          <button
            className={`tab-trigger ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('roles');
              setSearchTerm('');
            }}
          >
            <Shield size={16} />
            <span>Security Roles</span>
          </button>
        </div>
        <div className="tab-search-wrapper" style={{ width: '100%', maxWidth: '360px' }}>
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder={activeTab === 'users' ? "Search by account or name..." : "Search by role name..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="users-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Connecting to Dragon ESL Cloud...</p>
        </div>
      ) : error ? (
        <div className="users-error glass-card">
          <Info size={32} className="text-danger" />
          <p>{error}</p>
          <button onClick={fetchData} className="btn-primary">Try Again</button>
        </div>
      ) : activeTab === 'users' ? (
        /* Users Tab Content */
        totalCount === 0 ? (
          <div className="users-empty glass-card">
            <UserIcon size={48} />
            <h3>No Staff Users Found</h3>
            <p>Start by adding your first operator or administrative user.</p>
            <button className="btn-primary" onClick={handleOpenCreateUser}>Create User</button>
          </div>
        ) : (
          <div className="users-table-wrapper glass-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Account</th>
                  <th>Role Name</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-name-col">
                        <div className="user-avatar-circle">
                          {user.staffName ? user.staffName.substring(0, 2).toUpperCase() : 'ST'}
                        </div>
                        <div>
                          <div className="font-semibold">{user.staffName || 'Unnamed Staff'}</div>
                          <div className="text-muted text-xs">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="text-sm">{user.account}</code>
                    </td>
                    <td>
                      <span className="role-chip">
                        <Shield size={12} />
                        <span>{user.roleName || 'No Role Assigned'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="date-display">
                        <Calendar size={12} />
                        <span>{user.createTime || 'N/A'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="badge-normal">
                        Normal
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-action" onClick={() => handleOpenEditUser(user)} title="Edit User">
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-action danger" onClick={() => user.id && handleUserDelete(user.id)} title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Premium Zkong/DragonESL Pagination */}
            {totalCount > 0 && (
              <div className="dragonesl-pagination-bar" style={{ padding: '16px 0 0 0', marginTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                <div className="pagination-left">
                  <span className="pagination-total">Total {totalCount} items</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="pagination-size-select"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                    <option value={100}>100 / page</option>
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
                    <span>Go to</span>
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
          </div>
        )
      ) : (
        /* Roles Tab Content */
        filteredRoles.length === 0 ? (
          <div className="users-empty glass-card">
            <Shield size={48} />
            <h3>No Roles Found</h3>
            <p>Start by adding your custom security roles.</p>
            <button className="btn-primary" onClick={handleOpenCreateRole}>Create Role</button>
          </div>
        ) : (
          <div className="roles-grid">
            {filteredRoles.map(role => (
              <div key={role.id} className="role-card glass-card">
                <div className="role-card-header">
                  <div className="role-card-icon">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3>{role.roleName}</h3>
                    <span className="role-card-subtitle">ID: {role.id}</span>
                  </div>
                </div>
                
                <div className="role-card-body">
                  <div className="role-meta-row">
                    <Calendar size={14} className="text-muted" />
                    <span>Created: {role.createTime || 'N/A'}</span>
                  </div>
                  <div className="role-meta-row">
                    <Info size={14} className="text-muted" />
                    <span>Merchant: {role.merchantId || 'Shared'}</span>
                  </div>
                </div>

                <div className="role-card-actions">
                  <button className="btn-text" onClick={() => handleOpenEditRole(role)}>
                    <Edit2 size={15} /> Edit Role
                  </button>
                  <button className="btn-text danger" onClick={() => role.id && handleRoleDelete(role.id)}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{isEditingUser ? 'Edit Staff User' : 'Create New User'}</h3>
              <button className="close-btn" onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="modal-form">
              <div className="form-group">
                <label>Login Account *</label>
                <input 
                  required 
                  type="text" 
                  disabled={isEditingUser}
                  value={userFormData.account}
                  onChange={e => setUserFormData({ ...userFormData, account: e.target.value })}
                  className="glass-input" 
                  placeholder="6-20 alphanumeric characters" 
                />
              </div>

              <div className="form-group">
                <label>Staff Name *</label>
                <input 
                  required 
                  type="text" 
                  value={userFormData.staffName}
                  onChange={e => setUserFormData({ ...userFormData, staffName: e.target.value })}
                  className="glass-input" 
                  placeholder="e.g. Abdullah Salem" 
                />
              </div>

              <div className="form-group">
                <label>{isEditingUser ? 'New Password (Optional)' : 'Password *'}</label>
                <div className="password-input-wrapper">
                  <Key size={16} className="pass-icon text-muted" />
                  <input 
                    required={!isEditingUser}
                    type="password" 
                    value={userFormData.password}
                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="glass-input" 
                    placeholder={isEditingUser ? 'Leave blank to keep current password' : 'Min 8 chars, mixed letters & numbers'} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Role *</label>
                <select 
                  required 
                  value={userFormData.roleId}
                  onChange={e => setUserFormData({ ...userFormData, roleId: e.target.value })}
                  className="glass-input"
                >
                  <option value="">Select Security Role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.roleName}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditingUser ? 'Save User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card modal-content-wide">
            <div className="modal-header">
              <h3>{isEditingRole ? 'Edit Security Role' : 'Create Custom Role'}</h3>
              <button className="close-btn" onClick={() => setIsRoleModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRoleSubmit} className="modal-form">
              <div className="form-group">
                <label>Role Name *</label>
                <input 
                  required 
                  type="text" 
                  value={roleFormData.roleName}
                  onChange={e => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                  className="glass-input" 
                  placeholder="e.g. Inventory Manager" 
                />
              </div>

              <div className="form-group permissions-box">
                <label>Functional Authority (Menu Access Permissions)</label>
                <p className="permissions-help text-xs text-muted">Select the specific pages and features that users with this role can access.</p>
                
                <div className="permissions-grid">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = roleFormData.menuIdList.includes(perm.id);
                    return (
                      <div 
                        key={perm.id} 
                        className={`permission-item glass-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => handleTogglePermission(perm.id)}
                      >
                        <div className="perm-checkbox">
                          {isChecked ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                        </div>
                        <div className="perm-details">
                          <span className="font-semibold text-sm">{perm.name}</span>
                          <span className="text-xs text-muted">Key: {perm.code} (ID: {perm.id})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Sheets */}
      <style>{`
        .users-page-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .toast-notification {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 16px 24px;
          border-radius: 8px;
          z-index: 1100;
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

        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .users-header h2 {
          font-size: 24px;
          font-weight: 700;
        }

        .users-header-actions {
          display: flex;
          gap: 12px;
        }

        /* Tabs Panel */
        .users-tabs-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
        }

        .tabs-list {
          display: flex;
          gap: 8px;
        }

        .tab-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-trigger:hover {
          background: var(--bg-accent);
          color: var(--text-primary);
        }

        .tab-trigger.active {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .tab-search-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          width: 320px;
        }

        .tab-search-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
        }

        /* Tables & Lists */
        .users-table-wrapper {
          padding: 8px;
          overflow-x: auto;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .users-table th {
          padding: 16px 20px;
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border);
        }

        .users-table td {
          padding: 16px 20px;
          border-bottom: 1px solid var(--glass-border);
          color: var(--text-primary);
        }

        .users-table tr:last-child td {
          border-bottom: none;
        }

        .user-name-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .role-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
          font-size: 12px;
          font-weight: 600;
        }

        .date-display {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .badge-normal {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.15);
          color: var(--success-color);
          text-transform: uppercase;
        }

        .table-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .icon-action {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-action:hover {
          background: var(--bg-accent);
          color: var(--text-primary);
        }

        .icon-action.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-color);
        }

        /* Roles Grid */
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .role-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .role-card-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .role-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981, #06b6d4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .role-card h3 {
          font-size: 16px;
          font-weight: 700;
        }

        .role-card-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          font-family: monospace;
        }

        .role-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px 0;
          border-top: 1px dashed var(--glass-border);
          padding-top: 12px;
          margin-top: 4px;
        }

        .role-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .role-card-actions {
          display: flex;
          gap: 12px;
          border-top: 1px solid var(--glass-border);
          padding-top: 16px;
          margin-top: 4px;
        }

        /* Modals & Forms */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 11, 15, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: modalFadeIn 0.3s ease-out;
        }

        .modal-content {
          background: var(--glass-bg);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 520px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          overflow-y: auto;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-content-wide {
          max-width: 720px !important;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-wrapper input {
          padding-left: 40px !important;
          width: 100%;
        }

        .pass-icon {
          position: absolute;
          left: 14px;
        }

        .permissions-box {
          border-top: 1px solid var(--glass-border);
          padding-top: 16px;
          margin-top: 4px;
        }

        .permissions-help {
          margin-bottom: 12px;
        }

        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
          max-height: 280px;
          overflow-y: auto;
          padding: 4px;
        }

        .permission-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .permission-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--primary-color);
        }

        .permission-item.selected {
          background: rgba(59, 130, 246, 0.06);
          border-color: var(--primary-color);
        }

        .perm-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .perm-details {
          display: flex;
          flex-direction: column;
        }

        .users-loading, .users-empty, .users-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          text-align: center;
          color: var(--text-muted);
          gap: 16px;
        }

        .pagination-dots {
          color: var(--text-muted);
          padding: 8px 12px;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default Users;
