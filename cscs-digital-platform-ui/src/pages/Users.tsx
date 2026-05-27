import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, User as UserIcon, Edit2, Trash2, Key, Calendar, RefreshCw, Loader2, X, CheckSquare, Square, Info, ChevronDown, ChevronRight, ChevronLeft, MinusSquare } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role, PermissionMenu } from '../services/userService';
import { storeService } from '../services/storeService';
import type { Store as StoreType } from '../services/storeService';
import { getPaginationRange } from '../utils/paginationUtils';

const AVAILABLE_PERMISSIONS = [
  { id: 135, name: 'Product Management / إدارة المنتجات', code: 'product' },
  { id: 138, name: 'Store Management / إدارة المتاجر', code: 'store' },
  { id: 133, name: 'ESL Device Management / إدارة أجهزة بطاقات الأسعار', code: 'equipment' },
  { id: 141, name: 'Role & System Settings / أدوار وإعدادات النظام', code: 'system' },
  { id: 134, name: 'ESL & System Logs / سجلات النظام وبطاقات الأسعار', code: 'log' },
  { id: 139, name: 'Staff User Management / إدارة حسابات الموظفين', code: 'staffManager' },
  { id: 136, name: 'Display Templates / قوالب العرض', code: 'template' },
  { id: 311, name: 'System Alarm Alerts / تنبيهات إنذار النظام', code: 'alarm' },
  { id: 309, name: 'Dashboard Statistics / إحصائيات لوحة التحكم', code: 'statistics' },
  { id: 224, name: 'Material Assets / الأصول والمواد', code: 'material' },
];

// Helper to sort permission menu items in depth-first hierarchical order
const getSortedTreeList = (permissions: PermissionMenu[]): PermissionMenu[] => {
  const ids = new Set(permissions.map(p => p.id));
  const roots = permissions.filter(p => !p.parentId || p.parentId === 0 || !ids.has(p.parentId));
  const childrenMap = new Map<number, PermissionMenu[]>();
  
  permissions.forEach(p => {
    if (p.parentId && p.parentId !== 0 && ids.has(p.parentId)) {
      if (!childrenMap.has(p.parentId)) {
        childrenMap.set(p.parentId, []);
      }
      childrenMap.get(p.parentId)!.push(p);
    }
  });

  const result: PermissionMenu[] = [];
  const traverse = (node: PermissionMenu) => {
    result.push(node);
    const children = childrenMap.get(node.id) || [];
    children.sort((a, b) => a.id - b.id);
    children.forEach(child => traverse(child));
  };

  roots.sort((a, b) => a.id - b.id);
  roots.forEach(root => traverse(root));
  
  return result;
};

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
    }, 3000);
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

  // Store Data Access Form
  const [userStoreFormData, setUserStoreFormData] = useState<{
    isAllStore: boolean;
    selectedStores: StoreType[];
  }>({
    isAllStore: true,
    selectedStores: []
  });

  // Store Selection Modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [allStores, setAllStores] = useState<StoreType[]>([]);
  
  // Shuttle modal states
  const [searchUnselected, setSearchUnselected] = useState('');
  const [searchSelected, setSearchSelected] = useState('');
  const [modalUnselectedStores, setModalUnselectedStores] = useState<StoreType[]>([]);
  const [modalSelectedStores, setModalSelectedStores] = useState<StoreType[]>([]);

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
  const [availablePermissions, setAvailablePermissions] = useState<PermissionMenu[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Record<number, boolean>>({});

  const normalizePermissionItems = (data: any): PermissionMenu[] => {
    if (!data) {
      return [];
    }

    const list = Array.isArray(data?.list)
      ? data.list
      : Array.isArray(data?.menuList)
        ? data.menuList
        : Array.isArray(data)
          ? data
          : [];

    return list.map((item: any) => ({
      id: Number(item.id),
      menuName: String(item.menuName || item.name || item.title || `Permission ${item.id}`),
      level: Number(item.level ?? item.levelNo ?? 0),
      parentId: item.pid != null ? Number(item.pid) : (item.parentId != null ? Number(item.parentId) : undefined),
      zkUrl: item.zkUrl || item.url || item.path || undefined,
    }));
  };

  const loadPermissions = async (roleId?: string | number) => {
    setPermissionsLoading(true);
    try {
      const permissionsData = await userService.getPermissions(roleId);
      const normalized = normalizePermissionItems(permissionsData);
      setAvailablePermissions(normalized);
      return normalized;
    } catch (err) {
      console.error('Failed to load permission tree from Dragon ESL, falling back to static permissions', err);
      const fallbackList: PermissionMenu[] = AVAILABLE_PERMISSIONS.map(item => ({
        id: item.id,
        menuName: item.name,
        level: 1,
        parentId: 0,
      }));
      setAvailablePermissions(fallbackList);
      return fallbackList;
    } finally {
      setPermissionsLoading(false);
    }
  };

  const getDescendantIds = (id: number, items: PermissionMenu[]) => {
    const children = items.filter(item => item.parentId === id);
    if (!children.length) {
      return [];
    }
    return children.reduce<number[]>((acc, child) => {
      acc.push(child.id);
      acc.push(...getDescendantIds(child.id, items));
      return acc;
    }, []);
  };

  const getAncestorIds = (id: number, items: PermissionMenu[]): number[] => {
    const item = items.find(entry => entry.id === id);
    if (!item || !item.parentId || item.parentId === 0) {
      return [];
    }
    return [item.parentId, ...getAncestorIds(item.parentId, items)];
  };

  // Helper to determine if a menu item should be visible based on expanded state
  const isMenuVisible = (perm: PermissionMenu): boolean => {
    if (!perm.parentId || perm.parentId === 0) {
      return true;
    }
    const parentExpanded = expandedMenuIds[perm.parentId];
    if (!parentExpanded) {
      return false;
    }
    const parent = availablePermissions.find(p => p.id === perm.parentId);
    if (!parent) {
      return false;
    }
    return isMenuVisible(parent);
  };

  // Auto-expand all parent menus upon loading
  useEffect(() => {
    if (availablePermissions.length > 0) {
      const initialExpanded: Record<number, boolean> = {};
      availablePermissions.forEach(perm => {
        const hasChildren = availablePermissions.some(child => child.parentId === perm.id);
        if (hasChildren) {
          initialExpanded[perm.id] = true;
        }
      });
      setExpandedMenuIds(initialExpanded);
    }
  }, [availablePermissions]);

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
            staffName: u.name || u.staffName || 'Unnamed Staff / موظف غير مسمى',
            roleId: u.roleId,
            roleName: item.roleName || u.roleName || 'No Role Assigned / لم يتم تعيين دور',
            createTime: u.createTime,
            status: u.enable === 1 ? 'Normal / طبيعي' : 'Disabled / معطل',
            allStorePermission: u.allStorePermission,
            storeIdList: u.storeIdList,
          };
        });
        setUsers(mappedUsers);
      } else {
        const rolesRes = await userService.listRoles(1, 100);
        const rawData = rolesRes;
        const rolesList = Array.isArray(rawData) ? rawData : (rawData?.list || []);
        
        const mappedRoles = rolesList.map((r: any) => ({
          id: r.id,
          roleName: r.roleName || r.name || 'Unnamed Role / دور غير مسمى',
          merchantId: r.merchantId || '1775639851383',
          createTime: r.createTime || 'Shared / مشترك',
          _pending: r._pending === true || r.id === -1,
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
      const mappedRoles = rolesList
        .filter((r: any) => r.id !== -1 && r._pending !== true) // exclude pending roles not yet propagated to ZKong
        .map((r: any) => ({
          id: r.id,
          roleName: r.roleName || r.name || 'Unnamed Role / دور غير مسمى',
          merchantId: r.merchantId || '1775639851383',
          createTime: r.createTime || 'Shared / مشترك',
        }));
      setRoles(mappedRoles);
    } catch (err) {
      console.error('Failed to load roles for dropdown', err);
    }
  };

  // User Actions
  const loadStores = async () => {
    try {
      const res = await storeService.getAllStores();
      setAllStores(res || []);
      return res || [];
    } catch (err) {
      console.error('Failed to load stores', err);
      return [];
    }
  };

  const handleOpenCreateUser = async () => {
    setIsEditingUser(false);
    setEditingUserId(null);
    setUserFormData({ account: 'DG0358', staffName: '', password: '', roleId: '' });
    setUserStoreFormData({ isAllStore: true, selectedStores: [] });
    loadRolesDropdown();
    await loadStores();
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = async (user: any) => {
    setIsEditingUser(true);
    setEditingUserId(user.id || null);
    setUserFormData({
      account: user.account || '',
      staffName: user.staffName || '',
      password: '', // Password empty by default for edit
      roleId: user.roleId?.toString() || '',
    });
    
    setUserStoreFormData({
      isAllStore: user.allStorePermission === 1,
      selectedStores: []
    });

    loadRolesDropdown();
    const stores = await loadStores();
    
    if (user.allStorePermission === 0 && user.storeIdList && Array.isArray(user.storeIdList)) {
      const selected = stores.filter(s => user.storeIdList.includes(s.storeId));
      setUserStoreFormData(prev => ({ ...prev, selectedStores: selected }));
    }
    
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
        allStorePermission: userStoreFormData.isAllStore ? 1 : 0,
        storeIdList: userStoreFormData.isAllStore ? [] : userStoreFormData.selectedStores.map(s => s.storeId)
      };
      
      if (userFormData.password) {
        payload.password = userFormData.password;
      }

      if (isEditingUser && editingUserId) {
        await userService.updateUser(editingUserId, payload);
        showNotification('User updated successfully / تم تحديث المستخدم بنجاح', 'success');
      } else {
        if (!userFormData.password) {
          showNotification('Password is required for new users / كلمة المرور مطلوبة للمستخدمين الجدد', 'error');
          setFormLoading(false);
          return;
        }
        await userService.addUser(payload);
        showNotification('User added successfully / تمت إضافة المستخدم بنجاح', 'success');
      }
      
      setIsUserModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(`Failed to ${isEditingUser ? 'update' : 'add'} user. Please try again. / فشل ${isEditingUser ? 'تحديث' : 'إضافة'} المستخدم. يرجى المحاولة مرة أخرى.`, 'error');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUserDelete = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User / حذف المستخدم',
      message: 'Are you sure you want to delete this user? / هل أنت متأكد من حذف هذا المستخدم؟',
      onConfirm: async () => {
        try {
          await userService.deleteUser(id);
          fetchData();
          showNotification('User deleted successfully / تم حذف المستخدم بنجاح', 'success');
        } catch (err: any) {
          showNotification('Failed to delete user. Please try again. / فشل حذف المستخدم. يرجى المحاولة مرة أخرى.', 'error');
          console.error(err);
        }
      }
    });
  };

  // Role Actions
  const handleOpenCreateRole = async () => {
    setIsEditingRole(false);
    setEditingRoleId(null);
    setRoleFormData({ roleName: '', menuIdList: [] });
    await loadPermissions(3);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = async (role: Role) => {
    setIsEditingRole(true);
    setEditingRoleId(role.id || null);
    setRoleFormData({ roleName: role.roleName || '', menuIdList: [] });
    const basePermissions = await loadPermissions(3);

    try {
      const permissionsData = await userService.getPermissions(role.id);
      const existingIds = normalizePermissionItems(permissionsData).map((m: any) => m.id);
      setRoleFormData({
        roleName: role.roleName || '',
        menuIdList: existingIds,
      });
    } catch (err) {
      console.error('Failed to load selected permissions for role', err);
      setRoleFormData({
        roleName: role.roleName || '',
        menuIdList: role.menuIdList || [],
      });
    }

    if (!basePermissions.length) {
      await loadPermissions(3);
    }
    setIsRoleModalOpen(true);
  };

  const handleTogglePermission = (id: number) => {
    setRoleFormData(prev => {
      const alreadyChecked = prev.menuIdList.includes(id);
      if (alreadyChecked) {
        // Unchecking: uncheck this item and all its descendants
        const descendants = getDescendantIds(id, availablePermissions);
        const toRemove = [id, ...descendants];
        return {
          ...prev,
          menuIdList: prev.menuIdList.filter(permId => !toRemove.includes(permId)),
        };
      } else {
        // Checking: check this item and all its ancestors
        const ancestors = getAncestorIds(id, availablePermissions);
        return {
          ...prev,
          menuIdList: Array.from(new Set([...prev.menuIdList, id, ...ancestors])),
        };
      }
    });
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEditingRole && editingRoleId) {
        await userService.updateRole(editingRoleId, roleFormData);
        showNotification('Role updated successfully / تم تحديث الدور بنجاح', 'success');
      } else {
        await userService.addRole(roleFormData);
        showNotification('Role added successfully / تمت إضافة الدور بنجاح', 'success');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification(`Failed to ${isEditingRole ? 'update' : 'add'} role. Please try again. / فشل ${isEditingRole ? 'تحديث' : 'إضافة'} الدور. يرجى المحاولة مرة أخرى.`, 'error');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleDelete = (id: string | number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Role / حذف الدور',
      message: 'Are you sure you want to delete this role? This cannot be undone. / هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await userService.deleteRole(id);
          fetchData();
          showNotification('Role deleted successfully / تم حذف الدور بنجاح', 'success');
        } catch (err: any) {
          showNotification('Failed to delete role. Please try again. / فشل حذف الدور. يرجى المحاولة مرة أخرى.', 'error');
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
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)}>Cancel / إلغاء</button>
              <button className="btn-primary danger" onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}>Confirm / تأكيد</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="users-header">
        <div>
          <h2>Staff User Management / إدارة حسابات الموظفين</h2>
        </div>
        <div className="users-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? "Search by account or name... / ابحث بالحساب أو الاسم..." : "Search by role name... / ابحث باسم الدور..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh / تحديث
          </button>
          {activeTab === 'users' ? (
            <button className="btn-primary" onClick={handleOpenCreateUser}>
              <Plus size={18} /> Create User / إضافة مستخدم
            </button>
          ) : (
            <button className="btn-primary" onClick={handleOpenCreateRole}>
              <Plus size={18} /> Create Role / إضافة دور
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="users-tabs-navigation glass-card" style={{ justifyContent: 'flex-start' }}>
        <div className="tabs-list">
          <button
            className={`tab-trigger ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSearchTerm('');
            }}
          >
            <UserIcon size={16} />
            <span>Staff Users / الموظفين</span>
          </button>
          <button
            className={`tab-trigger ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('roles');
              setSearchTerm('');
            }}
          >
            <Shield size={16} />
            <span>Security Roles / أدوار الأمان</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="users-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Connecting to Dragon ESL Cloud... / جاري الاتصال بسحابة Dragon ESL...</p>
        </div>
      ) : error ? (
        <div className="users-error glass-card">
          <Info size={32} className="text-danger" />
          <p>{error}</p>
          <button onClick={fetchData} className="btn-primary">Try Again / أعد المحاولة</button>
        </div>
      ) : activeTab === 'users' ? (
        /* Users Tab Content */
        totalCount === 0 ? (
          <div className="users-empty glass-card">
            <UserIcon size={48} />
            <h3>No Staff Users Found / لم يتم العثور على موظفين</h3>
            <p>Start by adding your first operator or administrative user. / ابدأ بإضافة أول مشغل أو مستخدم إداري.</p>
            <button className="btn-primary" onClick={handleOpenCreateUser}>Create User / إضافة مستخدم</button>
          </div>
        ) : (
          <div className="users-table-wrapper glass-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Staff Name / اسم الموظف</th>
                  <th>Account / الحساب</th>
                  <th>Role Name / اسم الدور</th>
                  <th>Created Date / تاريخ الإنشاء</th>
                  <th>Status / الحالة</th>
                  <th style={{ textAlign: 'right' }}>Actions / الإجراءات</th>
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
                          <div className="font-semibold">{user.staffName || 'Unnamed Staff / موظف غير مسمى'}</div>
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
                        <span>{user.roleName || 'No Role Assigned / لم يتم تعيين دور'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="date-display">
                        <Calendar size={12} />
                        <span>{user.createTime || 'N/A / غير متوفر'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="badge-normal">
                        {user.status || 'Normal / طبيعي'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-action" onClick={() => handleOpenEditUser(user)} title="Edit User / تعديل المستخدم">
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-action danger" onClick={() => user.id && handleUserDelete(user.id)} title="Delete User / حذف المستخدم">
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
                  <span className="pagination-total">Total {totalCount} items / الإجمالي {totalCount} عناصر</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="pagination-size-select"
                  >
                    <option value={5}>5/page / ٥ في الصفحة</option>
                    <option value={10}>10/page / ١٠ في الصفحة</option>
                    <option value={20}>20/page / ٢٠ في الصفحة</option>
                    <option value={50}>50/page / ٥٠ في الصفحة</option>
                    <option value={100}>100/page / ١٠٠ في الصفحة</option>
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
          </div>
        )
      ) : (
        /* Roles Tab Content */
        filteredRoles.length === 0 ? (
          <div className="users-empty glass-card">
            <Shield size={48} />
            <h3>No Roles Found / لم يتم العثور على أدوار</h3>
            <p>Start by adding your custom security roles. / ابدأ بإضافة أدوار الأمان المخصصة الخاصة بك.</p>
            <button className="btn-primary" onClick={handleOpenCreateRole}>Create Role / إضافة دور</button>
          </div>
        ) : (
          <div className="roles-grid">
            {filteredRoles.map(role => (
              <div key={role.id} className={`role-card glass-card${role._pending ? ' role-card-pending' : ''}`}>
                <div className="role-card-header">
                  <div className="role-card-icon">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3>
                      {role.roleName}
                      {role._pending && (
                        <span className="role-pending-badge">Syncing... / جاري المزامنة</span>
                      )}
                    </h3>
                    <span className="role-card-subtitle">ID: {role._pending ? 'Syncing... / جاري' : role.id}</span>
                  </div>
                </div>
                
                <div className="role-card-body">
                  <div className="role-meta-row">
                    <Calendar size={14} className="text-muted" />
                    <span>Created / تم الإنشاء: {role.createTime || 'N/A / غير متوفر'}</span>
                  </div>
                  <div className="role-meta-row">
                    <Info size={14} className="text-muted" />
                    <span>Merchant / التاجر: {role.merchantId || 'Shared / مشترك'}</span>
                  </div>
                </div>

                <div className="role-card-actions">
                  {role._pending ? (
                    <span className="role-syncing-note">Waiting for ZKong sync... / في انتظار المزامنة</span>
                  ) : (
                    <>
                      <button className="btn-text" onClick={() => handleOpenEditRole(role)}>
                        <Edit2 size={15} /> Edit Role / تعديل الدور
                      </button>
                      <button className="btn-text danger" onClick={() => role.id && handleRoleDelete(role.id)}>
                        <Trash2 size={15} /> Delete / حذف
                      </button>
                    </>
                  )}
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
              <h3>{isEditingUser ? 'Edit Staff User / تعديل الموظف' : 'Create New User / إنشاء مستخدم جديد'}</h3>
              <button className="close-btn" onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="modal-form">
              <div className="form-group">
                <label>Login Account <span className="required-asterisk">*</span> / حساب الدخول <span className="required-asterisk">*</span></label>
                <input 
                  required 
                  type="text" 
                  disabled={isEditingUser}
                  value={userFormData.account}
                  onChange={e => setUserFormData({ ...userFormData, account: e.target.value })}
                  className="glass-input" 
                  placeholder="6-20 alphanumeric characters / ٦-٢٠ حرفاً أو رقماً" 
                />
              </div>

              <div className="form-group">
                <label>Staff Name <span className="required-asterisk">*</span> / اسم الموظف <span className="required-asterisk">*</span></label>
                <input 
                  required 
                  type="text" 
                  value={userFormData.staffName}
                  onChange={e => setUserFormData({ ...userFormData, staffName: e.target.value })}
                  className="glass-input" 
                  placeholder="e.g. Abdullah Salem / مثال: عبد الله سالم" 
                />
              </div>

              <div className="form-group">
                <label>
                  {isEditingUser ? (
                    <>New Password (Optional) / كلمة المرور الجديدة (اختياري)</>
                  ) : (
                    <>Password <span className="required-asterisk">*</span> / كلمة المرور <span className="required-asterisk">*</span></>
                  )}
                </label>
                <div className="password-input-wrapper">
                  <Key size={16} className="pass-icon text-muted" />
                  <input 
                    required={!isEditingUser}
                    type="password" 
                    value={userFormData.password}
                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="glass-input" 
                    placeholder={isEditingUser ? 'Leave blank to keep current password / اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : 'Min 8 chars, mixed letters & numbers / ٨ أحرف على الأقل، حروف وأرقام مختلطة'} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Role <span className="required-asterisk">*</span> / الدور المعين <span className="required-asterisk">*</span></label>
                <select 
                  required 
                  value={userFormData.roleId}
                  onChange={e => setUserFormData({ ...userFormData, roleId: e.target.value })}
                  className="glass-input"
                >
                  <option value="">Select Security Role... / اختر دور الأمان...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.roleName}</option>
                  ))}
                </select>
              </div>

              {/* ── Data Access Section ── */}
              <div className="form-group data-access-section" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <label style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>oganazation.DataAccess</label>
                  <button 
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setSearchUnselected('');
                      setSearchSelected('');
                      const selectedIds = new Set(userStoreFormData.selectedStores.map(s => s.storeId));
                      setModalSelectedStores([...userStoreFormData.selectedStores]);
                      setModalUnselectedStores(allStores.filter(s => !selectedIds.has(s.storeId)));
                      setIsStoreModalOpen(true);
                    }}
                    disabled={userStoreFormData.isAllStore}
                    style={{ fontSize: '13px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: userStoreFormData.isAllStore ? 'not-allowed' : 'pointer', opacity: userStoreFormData.isAllStore ? 0.5 : 1 }}
                  >
                    oganazation.addDataAccess
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    oganazation.allowshowdata
                    <input 
                      type="checkbox" 
                      checked={userStoreFormData.isAllStore}
                      onChange={(e) => setUserStoreFormData(prev => ({ ...prev, isAllStore: e.target.checked }))}
                      style={{ marginLeft: '8px', cursor: 'pointer' }}
                    />
                    oganazation.allStore
                  </label>
                </div>
                
                <div className="selected-stores-container" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', minHeight: '60px', padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {!userStoreFormData.isAllStore && userStoreFormData.selectedStores.map(store => (
                    <div key={store.storeId} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                      {store.storeName || store.storeId}
                      <button 
                        type="button"
                        onClick={() => setUserStoreFormData(prev => ({ ...prev, selectedStores: prev.selectedStores.filter(s => s.storeId !== store.storeId) }))}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {!userStoreFormData.isAllStore && userStoreFormData.selectedStores.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>No specific stores selected.</span>
                  )}
                  {userStoreFormData.isAllStore && (
                    <span style={{ color: 'var(--success-color)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>All stores access granted.</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel / إلغاء</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditingUser ? 'Save User / حفظ المستخدم' : 'Add User / إضافة مستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Selection Modal */}
      {isStoreModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ width: '700px', maxWidth: '95vw', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px' }}>Store selection</h3>
              <button className="close-btn" onClick={() => setIsStoreModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
              
              {/* Unselected Stores */}
              <div className="shuttle-box" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Unselected stores ({modalUnselectedStores.length})</span>
                  <button type="button" className="btn-link" style={{ fontSize: '12px' }} onClick={() => {
                    setModalSelectedStores(prev => [...prev, ...modalUnselectedStores]);
                    setModalUnselectedStores([]);
                  }}>Select All</button>
                </div>
                <div style={{ padding: '8px' }}>
                  <div className="search-bar" style={{ marginBottom: '8px' }}>
                    <Search size={16} />
                    <input type="text" placeholder="Search store name or ID" value={searchUnselected} onChange={e => setSearchUnselected(e.target.value)} style={{ padding: '6px 8px' }} />
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }}>
                    {modalUnselectedStores.filter(s => s.storeName.toLowerCase().includes(searchUnselected.toLowerCase()) || s.storeId.includes(searchUnselected)).map(store => (
                      <div key={store.storeId} style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => {
                        setModalUnselectedStores(prev => prev.filter(s => s.storeId !== store.storeId));
                        setModalSelectedStores(prev => [...prev, store]);
                      }}>
                        <div style={{ flex: 1 }}>{store.storeName}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{store.storeId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shuttle Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button type="button" className="btn-icon" style={{ borderRadius: '50%', background: 'var(--bg-primary)' }} disabled>
                  <ChevronRight size={16} />
                </button>
                <button type="button" className="btn-icon" style={{ borderRadius: '50%', background: 'var(--bg-primary)' }} disabled>
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Selected Stores */}
              <div className="shuttle-box" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Selected stores ({modalSelectedStores.length})</span>
                  <button type="button" className="btn-link" style={{ fontSize: '12px' }} onClick={() => {
                    setModalUnselectedStores(prev => [...prev, ...modalSelectedStores]);
                    setModalSelectedStores([]);
                  }}>Remove All</button>
                </div>
                <div style={{ padding: '8px' }}>
                  <div className="search-bar" style={{ marginBottom: '8px' }}>
                    <Search size={16} />
                    <input type="text" placeholder="Search store name or ID" value={searchSelected} onChange={e => setSearchSelected(e.target.value)} style={{ padding: '6px 8px' }} />
                  </div>
                  <div style={{ height: '240px', overflowY: 'auto' }}>
                    {modalSelectedStores.filter(s => s.storeName.toLowerCase().includes(searchSelected.toLowerCase()) || s.storeId.includes(searchSelected)).map(store => (
                      <div key={store.storeId} style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => {
                        setModalSelectedStores(prev => prev.filter(s => s.storeId !== store.storeId));
                        setModalUnselectedStores(prev => [...prev, store]);
                      }}>
                        <div style={{ flex: 1 }}>{store.storeName}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{store.storeId}</div>
                      </div>
                    ))}
                    {modalSelectedStores.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>No Data</div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="modal-actions" style={{ marginTop: '24px', justifyContent: 'center', gap: '16px' }}>
              <button type="button" className="btn-primary" onClick={() => {
                setUserStoreFormData(prev => ({ ...prev, selectedStores: modalSelectedStores }));
                setIsStoreModalOpen(false);
              }}>Confirm</button>
              <button type="button" className="btn-secondary" onClick={() => setIsStoreModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card modal-content-wide">
            <div className="modal-header">
              <h3>{isEditingRole ? 'Edit Security Role / تعديل دور الأمان' : 'Create Custom Role / إنشاء دور مخصص'}</h3>
              <button className="close-btn" onClick={() => setIsRoleModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRoleSubmit} className="modal-form">
              <div className="form-group">
                <label>Role Name <span className="required-asterisk">*</span> / اسم الدور <span className="required-asterisk">*</span></label>
                <input 
                  required 
                  type="text" 
                  value={roleFormData.roleName}
                  onChange={e => setRoleFormData({ ...roleFormData, roleName: e.target.value })}
                  className="glass-input" 
                  placeholder="e.g. Inventory Manager / مثال: مدير المخزون" 
                />
              </div>

              <div className="form-group permissions-box">
                <label>Functional Authority (Menu Access Permissions) / الصلاحية الوظيفية (صلاحيات الوصول للقائمة)</label>
                <p className="permissions-help text-xs text-muted">Select the specific pages and features that users with this role can access. / اختر الصفحات والميزات المحددة التي يمكن للمستخدمين الذين يمتلكون هذا الدور الوصول إليها.</p>
                
                {permissionsLoading ? (
                  <div className="permissions-loading">Loading permission tree from Dragon ESL...</div>
                ) : (
                  <div className="permissions-grid">
                    {getSortedTreeList(availablePermissions).map(perm => {
                      const isChecked = roleFormData.menuIdList.includes(perm.id);
                      const hasChildren = availablePermissions.some(child => child.parentId === perm.id);
                      const isExpanded = expandedMenuIds[perm.id];
                      
                      const isIndeterminate = (() => {
                        if (!isChecked) return false;
                        const descendants = getDescendantIds(perm.id, availablePermissions);
                        if (descendants.length === 0) return false;
                        const allChecked = descendants.every(childId => roleFormData.menuIdList.includes(childId));
                        return !allChecked;
                      })();

                      return (
                        <div 
                          key={perm.id} 
                          className={`permission-item glass-card ${isChecked ? 'selected' : ''}`}
                          onClick={() => handleTogglePermission(perm.id)}
                          style={{ 
                            paddingLeft: `${(perm.level || 0) * 16 + 8}px`,
                            display: isMenuVisible(perm) ? 'flex' : 'none',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {hasChildren ? (
                            <button
                              type="button"
                              className="tree-expand-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMenuIds(prev => ({ ...prev, [perm.id]: !prev[perm.id] }));
                              }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '4px',
                                display: 'flex', 
                                alignItems: 'center',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          ) : (
                            <div style={{ width: '22px' }} />
                          )}
                          <div 
                            className="perm-checkbox" 
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            {isIndeterminate ? (
                              <MinusSquare size={18} className="text-primary-semi" style={{ color: 'var(--text-muted)' }} />
                            ) : isChecked ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square size={18} />
                            )}
                          </div>
                          <div className="perm-details">
                            <span className="font-semibold text-sm">{perm.menuName}</span>
                            <span className="text-xs text-muted" style={{ marginLeft: '6px' }}>ID: {perm.id}{perm.zkUrl ? ` • ${perm.zkUrl}` : ''}</span>
                          </div>
                        </div>
                      );
                    })}
                    {availablePermissions.length === 0 && !permissionsLoading && (
                      <div className="text-muted">No permission tree available. Please refresh or check Dragon ESL connectivity.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel / إلغاء</button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditingRole ? 'Save Changes / حفظ التغييرات' : 'Create Role / إنشاء الدور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styled Sheets */}
      <style>{`
        .required-asterisk {
          color: #ef4444;
          margin-left: 3px;
          font-weight: 700;
        }

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
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 380px;
          overflow-y: auto;
          padding: 4px;
        }

        .permission-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          border-radius: 6px;
        }

        .permission-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .permission-item.selected {
          background: rgba(59, 130, 246, 0.06);
          border-color: rgba(59, 130, 246, 0.2);
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

        @media (max-width: 768px) {
          .users-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .users-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .users-tabs-navigation {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .tabs-list {
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .users-grid, .roles-grid {
            grid-template-columns: 1fr;
          }
          .form-row {
            flex-direction: column;
          }
          .table-wrapper {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default Users;
