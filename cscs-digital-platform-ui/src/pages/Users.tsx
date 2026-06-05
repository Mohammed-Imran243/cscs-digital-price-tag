import { StoreSelector } from '../components/common/StoreSelector';
import { Store as StoreIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, User as UserIcon, Edit2, Trash2, Key, Calendar, RefreshCw, Loader2, X, CheckSquare, Square, Info, ChevronDown, ChevronRight, ChevronLeft, MinusSquare } from 'lucide-react';
import { userService } from '../services/userService';
import type { User, Role, PermissionMenu } from '../services/userService';
import { storeService } from '../services/storeService';
import type { Store as StoreType } from '../services/storeService';
import { getPaginationRange } from '../utils/paginationUtils';
import { 
  PageHeader, 
  PageToolbar, 
  SearchInput, 
  ActionButtons, 
  DataTable, 
  PagePagination, 
  StatusBadge
} from '../components/common';
import { CustomSelect } from '../components/common/CustomSelect';
import { useLanguage } from '../context/LanguageContext';

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

import { useLocation, useNavigate } from 'react-router-dom';


const Users: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');
  const activeTab: 'users' | 'roles' = (tabParam === 'roles') ? 'roles' : 'users';

  const setActiveTab = (tab: 'users' | 'roles') => {
    navigate(`/users?tab=${tab}`, { replace: true });
  };
  
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [storesLoading, setStoresLoading] = useState(false);
  
  useEffect(() => {
    const loadStores = async () => {
      setStoresLoading(true);
      try {
        const response = await storeService.listStores(1, 100);
        const storeList = response.content || [];
        setStores(storeList);
      } catch (err) {
        console.error('Failed to load stores for users', err);
      } finally {
        setStoresLoading(false);
      }
    };
    loadStores();
  }, []);
  
const [showUserFilters, setShowUserFilters] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');
  const activeUserFilterCount = [filterRole !== 'All'].filter(Boolean).length;
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
    remark?: string;
    menuIdList: number[];
  }>({
    roleName: '',
    remark: '',
    menuIdList: [],
  });
  const [permSearchTerm, setPermSearchTerm] = useState('');
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
      console.error('Failed to load permission tree from the server, falling back to static permissions', err);
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

  // Auto-expand search matches
  useEffect(() => {
    if (permSearchTerm && availablePermissions.length > 0) {
      setExpandedMenuIds(prev => {
        const newExpanded = { ...prev };
        availablePermissions.forEach(perm => {
          if (perm.menuName.toLowerCase().includes(permSearchTerm.toLowerCase())) {
            const ancestors = getAncestorIds(perm.id, availablePermissions);
            ancestors.forEach(a => { newExpanded[a] = true; });
          }
        });
        return newExpanded;
      });
    }
  }, [permSearchTerm, availablePermissions]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const usersRes = await userService.listUsers(1, 100, selectedStore);
        const rawData = usersRes;
        const userList = rawData?.userVos || rawData?.userRoleStoreList || (Array.isArray(rawData) ? rawData : (rawData?.list || []));
        
        const mappedUsers = userList.map((item: any) => {
          const u = item.user || item;
          const rawRoleName = item.roleName || u.roleName || 'No Role Assigned / لم يتم تعيين دور';
          const translateMap: Record<string, string> = {
            '商家超级管理员': 'Merchant Super Administrator',
            '商家管理员': 'Merchant Administrator'
          };
          const translatedRoleName = translateMap[rawRoleName] || rawRoleName;
          
          return {
            id: u.id,
            account: u.account,
            staffName: u.name || u.staffName || 'Unnamed Staff / موظف غير مسمى',
            roleId: u.roleId,
            roleName: translatedRoleName,
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
        
        const mappedRoles = rolesList.map((r: any) => {
          const rawName = r.roleName || r.name || 'Unnamed Role / دور غير مسمى';
          const translateMap: Record<string, string> = {
            '商家超级管理员': 'Merchant Super Administrator',
            '商家管理员': 'Merchant Administrator'
          };
          const translatedName = translateMap[rawName] || rawName;
          
          return {
            id: r.id,
            roleName: translatedName,
            merchantId: r.merchantId || '1775639851383',
            createTime: r.createTime || 'Shared / مشترك',
            _pending: r._pending === true || r.id === -1,
          };
        });
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
  }, [activeTab, selectedStore]);

  // Pre-load roles list when user modal is opened
  const loadRolesDropdown = async () => {
    try {
      const rolesRes = await userService.listRoles(1, 100);
      const rawData = rolesRes;
      const rolesList = Array.isArray(rawData) ? rawData : (rawData?.list || []);
      const mappedRoles = rolesList
        .filter((r: any) => r.id !== -1 && r._pending !== true) // exclude pending roles not yet propagated to ZKong
        .map((r: any) => {
          const rawName = r.roleName || r.name || 'Unnamed Role / دور غير مسمى';
          const translateMap: Record<string, string> = {
            '商家超级管理员': 'Merchant Super Administrator',
            '商家管理员': 'Merchant Administrator'
          };
          const translatedName = translateMap[rawName] || rawName;
          return {
            id: r.id,
            roleName: translatedName,
            merchantId: r.merchantId || '1775639851383',
            createTime: r.createTime || 'Shared / مشترك',
          };
        });
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
    setRoleFormData({ roleName: '', remark: '', menuIdList: [] });
    setPermSearchTerm('');
    await loadPermissions(3);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = async (role: Role) => {
    setIsEditingRole(true);
    setEditingRoleId(role.id || null);
    setRoleFormData({ roleName: role.roleName || '', remark: role.remark || '', menuIdList: [] });
    setPermSearchTerm('');
    const basePermissions = await loadPermissions(3);

    try {
      const permissionsData = await userService.getPermissions(role.id);
      const existingIds = normalizePermissionItems(permissionsData).map((m: any) => m.id);
      setRoleFormData({
        roleName: role.roleName || '',
        remark: role.remark || '',
        menuIdList: existingIds,
      });
    } catch (err) {
      console.error('Failed to load selected permissions for role', err);
      setRoleFormData({
        roleName: role.roleName || '',
        remark: role.remark || '',
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
        // Checking: check this item and all its ancestors (do NOT automatically check descendants)
        const ancestors = getAncestorIds(id, availablePermissions);
        return {
          ...prev,
          menuIdList: Array.from(new Set([...prev.menuIdList, id, ...ancestors])),
        };
      }
    });
  };

  const handleSelectAll = () => setRoleFormData(prev => ({ ...prev, menuIdList: availablePermissions.map(p => p.id) }));
  const handleClearAll = () => setRoleFormData(prev => ({ ...prev, menuIdList: [] }));
  const handleExpandAll = () => {
    const allExpanded: Record<number, boolean> = {};
    availablePermissions.forEach(p => { allExpanded[p.id] = true; });
    setExpandedMenuIds(allExpanded);
  };
  const handleCollapseAll = () => setExpandedMenuIds({});

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
  const filteredUsers = users.filter(user => {
      const q = searchTerm.toLowerCase();
      return (user.account || '').toLowerCase().includes(q) ||
             (user.staffName || '').toLowerCase().includes(q) ||
             (user.roleName || '').toLowerCase().includes(q) ||
             (user.createTime || '').toLowerCase().includes(q) ||
             (user.status || 'Normal / طبيعي').toLowerCase().includes(q);
    });

  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const filteredRoles = roles.filter(role => {
      const q = searchTerm.toLowerCase();
      return (role.roleName || '').toLowerCase().includes(q) ||
             (role.id || '').toString().toLowerCase().includes(q);
    });

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

      <div className="sticky-page-header">
        {/* Header */}
        <PageHeader title="User Management / إدارة المستخدمين"
          titleAr="" />
        <PageToolbar>
          <div style={{ display: 'flex', gap: '16px', flex: 1, alignItems: 'center' }}>
            
            <div className="global-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder={activeTab === 'roles' ? "Search roles... / ابحث عن الأدوار..." : "Search users... / ابحث عن المستخدمين..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          </div>
          <ActionButtons
            onRefresh={fetchData}
            onAdd={activeTab === 'roles' ? handleOpenCreateRole : handleOpenCreateUser}
            addLabel={activeTab === 'roles' ? "Add Role" : "Add User"}
            addLabelAr={activeTab === 'roles' ? "إضافة دور" : "إضافة مستخدم"}
            loading={loading}
          />
        </PageToolbar>
        {/* Users Filter Panel */}
        {showUserFilters && (
          <div className="templates-filters glass-card" style={{ padding: '12px 16px', border: '1px solid var(--glass-border)', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', borderRadius: '12px' }}>
            <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px', minWidth: '150px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Role / الدور</label>
              <CustomSelect
                value={filterRole}
                onChange={(val: string | number) => setFilterRole(String(val))}
                options={[
                  { value: 'All', label: 'All Roles / جميع الأدوار' },
                  ...roles.map((r: any) => ({ value: String(r.id), label: r.roleName || r.name }))
                ]}
                className="glass-select"
              />
            </div>
            <button onClick={() => { setFilterRole('All'); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: '8px 12px', alignSelf: 'flex-end', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              Reset Filters / إعادة تعيين
            </button>
          </div>
        )}
  
        {/* Navigation Tabs */}
        <div className="nav-tabs-container" style={{ margin: '0 24px', marginBottom: '8px' }}>
          <button
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('users');
              setSearchTerm('');
            }}
          >
            <UserIcon size={16} />
            <span>Staff Users / الموظفين</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('roles');
              setSearchTerm('');
            }}
          >
            <Shield size={16} />
            <span>{t('Security Roles', 'أدوار الأمان')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="users-loading">
          <Loader2 className="animate-spin" size={40} />
          <p>Connecting to CSCS ESL Connect App... / جاري الاتصال بـ CSCS ESL Connect App...</p>
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
          <div className="table-card glass-card animate-fade-in" style={{ padding: 0 }}>
            <DataTable
              loading={false}
              data={paginatedUsers}
              emptyIcon={<UserIcon size={48} />}
              emptyTitle="No Staff Users Found"
              emptyTitleAr="لم يتم العثور على موظفين"
              columns={[
                {
                  key: 'staffName',
                  header: 'Staff Name',
                  headerAr: 'اسم الموظف',
                  render: (user: User) => (
                    <div className="user-name-col" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="user-avatar-circle" style={{ flexShrink: 0 }}>
                        {user.staffName ? user.staffName.substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="font-semibold" style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.2' }}>
                          {user.staffName || t('Unnamed Staff', 'موظف غير مسمى')}
                        </div>
                        <div className="text-muted" style={{ fontSize: '12px', fontWeight: '500' }}>
                          ID: {user.id}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'account',
                  header: 'Account',
                  headerAr: 'الحساب',
                  render: (user: User) => <code className="text-sm">{user.account}</code>
                },
                {
                  key: 'roleName',
                  header: 'Role Name',
                  headerAr: 'اسم الدور',
                  render: (user: User) => (
                    <span className="role-chip">
                      <Shield size={12} />
                      <span>{user.roleName || t('No Role Assigned', 'لم يتم تعيين دور')}</span>
                    </span>
                  )
                },
                {
                  key: 'createdDate',
                  header: 'Created Date',
                  headerAr: 'تاريخ الإنشاء',
                  render: (user: User) => (
                    <span className="date-display">
                      <Calendar size={12} />
                      <span>{user.createTime || t('N/A', 'غير متوفر')}</span>
                    </span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  headerAr: 'الحالة',
                  render: (user: User) => (
                    <span className="badge-normal">
                      {user.status || t('Normal', 'طبيعي')}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  headerAr: 'الإجراءات',
                  render: (user: User) => (
                    <div className="table-actions">
                      <button className="icon-action" onClick={() => handleOpenEditUser(user)} title="Edit User">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-action danger" onClick={() => user.id && handleUserDelete(user.id)} title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                }
              ]}
            />

            {totalCount > 0 && (
              <PagePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setCurrentPage(1);
                }}
              />
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

                <div className="role-card-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {role._pending ? (
                    <span className="role-syncing-note">Waiting for ZKong sync... / في انتظار المزامنة</span>
                  ) : (
                    <>
                      <button className="icon-action" onClick={() => handleOpenEditRole(role)} title="Edit Role / تعديل الدور">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-action danger" onClick={() => role.id && handleRoleDelete(role.id)} title="Delete Role / حذف">
                        <Trash2 size={16} />
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
          <div className="modal-content glass-card" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{isEditingUser ? 'Edit Staff User / تعديل الموظف' : 'Create New User / إنشاء مستخدم جديد'}</h3>
              <button className="close-btn" onClick={() => setIsUserModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleUserSubmit} className="create-form">
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
                <input 
                  required={!isEditingUser}
                  type="password" 
                  value={userFormData.password}
                  onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="glass-input" 
                  placeholder={isEditingUser ? 'Leave blank to keep current password / اتركه فارغاً للاحتفاظ بكلمة المرور الحالية' : 'Min 8 chars, mixed letters & numbers / ٨ أحرف على الأقل، حروف وأرقام مختلطة'} 
                />
              </div>

              <div className="form-group">
                <label>Assigned Role <span className="required-asterisk">*</span> / الدور المعين <span className="required-asterisk">*</span></label>
                <CustomSelect
                  value={userFormData.roleId}
                  onChange={(val: string | number) => setUserFormData({ ...userFormData, roleId: String(val) })}
                  options={roles.map(r => ({ value: r.id || '', label: r.roleName }))}
                  placeholder="Select Security Role... / اختر دور الأمان..."
                  className="glass-input"
                />
              </div>

              {/* ── Data Access Section ── */}
              <div className="form-group data-access-section" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <label style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Store Data Access / صلاحية الوصول للمتاجر
                  </label>
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
                    style={{
                      fontSize: '13px',
                      color: userStoreFormData.isAllStore ? 'var(--text-muted)' : 'var(--primary-color)',
                      background: 'none',
                      border: '1px solid',
                      borderColor: userStoreFormData.isAllStore ? 'var(--glass-border)' : 'rgba(59,130,246,0.4)',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      cursor: userStoreFormData.isAllStore ? 'not-allowed' : 'pointer',
                      opacity: userStoreFormData.isAllStore ? 0.5 : 1,
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    + Select Stores / اختيار المتاجر
                  </button>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '13px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    <input 
                      type="checkbox" 
                      checked={userStoreFormData.isAllStore}
                      onChange={(e) => setUserStoreFormData(prev => ({ ...prev, isAllStore: e.target.checked, selectedStores: e.target.checked ? [] : prev.selectedStores }))}
                      style={{ cursor: 'pointer', accentColor: 'var(--primary-color)', width: '16px', height: '16px' }}
                    />
                    All Stores Access / صلاحية جميع المتاجر
                  </label>
                </div>
                
                <div className="selected-stores-container" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  minHeight: '56px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  {userStoreFormData.isAllStore ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success-color)', fontSize: '13px', fontWeight: 600 }}>
                      <span style={{ fontSize: '16px' }}>✓</span>
                      Full access to all stores granted / صلاحية كاملة لجميع المتاجر
                    </span>
                  ) : userStoreFormData.selectedStores.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                      No stores selected — click "Select Stores" above / لم يتم اختيار متاجر — انقر على "اختيار المتاجر" أعلاه
                    </span>
                  ) : (
                    userStoreFormData.selectedStores.map(store => (
                      <div key={store.storeId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(59,130,246,0.12)',
                        color: 'var(--primary-color)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}>
                        {store.storeName || store.storeId}
                        <button
                          type="button"
                          onClick={() => setUserStoreFormData(prev => ({ ...prev, selectedStores: prev.selectedStores.filter(s => s.storeId !== store.storeId) }))}
                          style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, display: 'flex', opacity: 0.7 }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
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
          <div className="modal-content glass-card" style={{ width: '700px', maxWidth: '95vw', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px' }}>Store Selection / اختيار المتاجر</h3>
              <button className="close-btn" onClick={() => setIsStoreModalOpen(false)}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
              
              {/* Unselected Stores */}
              <div className="shuttle-box" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Available Stores ({modalUnselectedStores.length}) / المتاجر المتاحة</span>
                  <button type="button" className="btn-link" style={{ fontSize: '12px', color: 'var(--primary-color)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                    setModalSelectedStores(prev => [...prev, ...modalUnselectedStores]);
                    setModalUnselectedStores([]);
                  }}>Select All / اختيار الكل</button>
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
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Selected Stores ({modalSelectedStores.length}) / المتاجر المحددة</span>
                  <button type="button" className="btn-link" style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                    setModalUnselectedStores(prev => [...prev, ...modalSelectedStores]);
                    setModalSelectedStores([]);
                  }}>Remove All / إزالة الكل</button>
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
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No stores selected / لم يتم اختيار أي متجر
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="modal-actions" style={{ marginTop: '24px', justifyContent: 'center', gap: '16px' }}>
              <button type="button" className="btn-primary" onClick={() => {
                setUserStoreFormData(prev => ({ ...prev, selectedStores: modalSelectedStores }));
                setIsStoreModalOpen(false);
              }}>Confirm / تأكيد</button>
              <button type="button" className="btn-secondary" onClick={() => setIsStoreModalOpen(false)}>Cancel / إلغاء</button>
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
              <button className="close-btn" onClick={() => setIsRoleModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleRoleSubmit} className="modal-form" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', padding: 0 }}>
              <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
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
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Role Description (Optional) / وصف الدور (اختياري)</label>
                  <input 
                    type="text" 
                    value={roleFormData.remark || ''}
                    onChange={e => setRoleFormData({ ...roleFormData, remark: e.target.value })}
                    className="glass-input" 
                    placeholder="e.g. Users who manage stock levels / مثال: المستخدمون الذين يديرون مستويات المخزون" 
                  />
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div className="permissions-container">
                  {/* Sticky Toolbar */}
                  <div className="permissions-toolbar">
                    <div className="permissions-toolbar-top">
                      <div className="permission-search-bar">
                        <Search size={16} className="text-muted" />
                        <input 
                          type="text" 
                          placeholder="Search permissions... / ابحث في الصلاحيات..." 
                          value={permSearchTerm}
                          onChange={e => setPermSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="permission-stats">
                        <span className="permission-stat-badge highlight">Permissions Selected: {roleFormData.menuIdList.length}</span>
                        <span className="permission-stat-badge">Available Permissions: {availablePermissions.length}</span>
                      </div>
                    </div>
                    <div className="permissions-toolbar-bottom">
                      <button type="button" className="btn-link" onClick={handleSelectAll}>Select All</button>
                      <button type="button" className="btn-link" onClick={handleClearAll} style={{ color: 'var(--text-muted)' }}>Clear All</button>
                      <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
                      <button type="button" className="btn-link" onClick={handleExpandAll} style={{ color: 'var(--text-muted)' }}>Expand All</button>
                      <button type="button" className="btn-link" onClick={handleCollapseAll} style={{ color: 'var(--text-muted)' }}>Collapse All</button>
                    </div>
                  </div>

                  {/* Tree Area */}
                  <div style={{ paddingBottom: '24px' }}>
                    {permissionsLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading permission tree...</div>
                    ) : (
                      (() => {
                        const sortedList = getSortedTreeList(availablePermissions);
                        const filteredList = sortedList.filter(perm => {
                          if (!permSearchTerm) return true;
                          const matches = perm.menuName.toLowerCase().includes(permSearchTerm.toLowerCase());
                          if (matches) return true;
                          // If search matches a child, show parent
                          const descendants = getDescendantIds(perm.id, availablePermissions);
                          return descendants.some(childId => {
                            const child = availablePermissions.find(p => p.id === childId);
                            return child && child.menuName.toLowerCase().includes(permSearchTerm.toLowerCase());
                          });
                        });

                        if (filteredList.length === 0 && permSearchTerm) {
                          return (
                            <div className="empty-permissions-state">
                              <Search size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                              <div style={{ fontWeight: 600, marginBottom: '8px' }}>No permissions match your search.</div>
                              <div>Try a different term or clear the search field.</div>
                            </div>
                          );
                        }

                        const emptyStateMessage = (roleFormData.menuIdList.length === 0 && !permSearchTerm) ? (
                          <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', color: 'var(--primary-color)', fontSize: '13px', fontWeight: 500, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={16} /> No permissions selected yet. Choose permissions from the list below.
                          </div>
                        ) : null;

                        return (
                          <>
                            {emptyStateMessage}
                            {filteredList.map(perm => {
                          const isChecked = roleFormData.menuIdList.includes(perm.id);
                          const hasChildren = availablePermissions.some(child => child.parentId === perm.id);
                          const isExpanded = expandedMenuIds[perm.id];
                          const isTopLevel = !perm.parentId || perm.parentId === 0;
                          
                          const isIndeterminate = (() => {
                            if (!isChecked) return false;
                            const descendants = getDescendantIds(perm.id, availablePermissions);
                            if (descendants.length === 0) return false;
                            const allChecked = descendants.every(childId => roleFormData.menuIdList.includes(childId));
                            return !allChecked;
                          })();

                          // Highlighting logic
                          const renderHighlightedText = (text: string, highlight: string) => {
                            if (!highlight.trim()) return <span>{text}</span>;
                            const regex = new RegExp(`(${highlight})`, 'gi');
                            const parts = text.split(regex);
                            return (
                              <span>
                                {parts.map((part, i) => 
                                  regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
                                )}
                              </span>
                            );
                          };

                          if (isTopLevel) {
                            return (
                              <div key={perm.id} style={{ display: isMenuVisible(perm) || permSearchTerm ? 'block' : 'none' }}>
                                <div className="tree-section-header">
                                  {renderHighlightedText(perm.menuName, permSearchTerm)}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={perm.id} 
                              className="tree-node-compact"
                              onClick={() => handleTogglePermission(perm.id)}
                              style={{ 
                                paddingLeft: `${((perm.level || 1) - 1) * 24 + 16}px`,
                                display: isMenuVisible(perm) || permSearchTerm ? 'flex' : 'none',
                              }}
                            >
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedMenuIds(prev => ({ ...prev, [perm.id]: !prev[perm.id] }));
                                  }}
                                  style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', padding: '2px', 
                                    display: 'flex', alignItems: 'center', color: 'var(--text-muted)' 
                                  }}
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                              ) : (
                                <div style={{ width: '18px' }} />
                              )}
                              
                              <div className={`perm-checkbox ${isChecked ? 'checked' : ''}`}>
                                {isIndeterminate ? (
                                  <MinusSquare size={16} />
                                ) : isChecked ? (
                                  <CheckSquare size={16} />
                                ) : (
                                  <Square size={16} />
                                )}
                              </div>
                              
                              <div className="tree-node-text">
                                {renderHighlightedText(perm.menuName, permSearchTerm)}
                              </div>
                            </div>
                          );
                        })}
                        </>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions" style={{ padding: '24px', paddingTop: 0, justifyContent: 'flex-end', gap: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel / إلغاء</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={formLoading || !roleFormData.roleName.trim() || roleFormData.menuIdList.length === 0}
                  title={roleFormData.menuIdList.length === 0 ? "Select at least one permission to create a role" : ""}
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : isEditingRole ? 'Save Changes' : 'Create Role'}
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

        .btn-link {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          padding: 0;
          transition: opacity 0.2s;
        }

        .btn-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .btn-text {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: var(--primary-color);
          padding: 6px 10px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-text:hover {
          background: rgba(59,130,246,0.08);
        }

        .btn-text.danger {
          color: var(--danger-color);
        }

        .btn-text.danger:hover {
          background: rgba(239,68,68,0.08);
        }

        .role-pending-badge {
          margin-left: 8px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(245,158,11,0.15);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.3);
          padding: 2px 8px;
          border-radius: 10px;
        }

        .role-card-pending {
          border-color: rgba(245,158,11,0.3) !important;
          opacity: 0.85;
        }

        .role-syncing-note {
          font-size: 12px;
          color: #f59e0b;
          font-style: italic;
        }

        .global-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          min-width: 260px;
        }

        .global-search-bar input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Users;
