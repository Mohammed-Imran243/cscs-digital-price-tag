import api, { unwrapResponse } from './api';

export interface User {
  id?: string;
  account: string;
  staffName?: string;
  roleId?: number | string;
  roleName?: string;
  password?: string;
  status?: string;
  createTime?: string;
  lastLoginTime?: string;
}

export interface Role {
  id?: string | number;
  roleName: string;
  remark?: string;
  merchantId?: string;
  createTime?: string;
  menuIdList?: number[];
  _pending?: boolean;
}

export interface PermissionMenu {
  id: number;
  menuName: string;
  level: number;
  parentId?: number;
  zkUrl?: string;
}

export const userService = {
  listUsers: async (pageNum = 1, pageSize = 10) => {
    const response = await api.get(`/users?pageNum=${pageNum}&pageSize=${pageSize}`);
    return unwrapResponse<any>(response);
  },

  addUser: async (userData: Partial<User>) => {
    const response = await api.post('/users', userData);
    return unwrapResponse<any>(response);
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/users/${id}`, userData);
    return unwrapResponse<any>(response);
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return unwrapResponse<any>(response);
  },

  listRoles: async (pageNum = 1, pageSize = 10) => {
    const response = await api.get(`/roles?pageNum=${pageNum}&pageSize=${pageSize}`);
    return unwrapResponse<any>(response);
  },

  addRole: async (roleData: Partial<Role>) => {
    const response = await api.post('/roles', roleData);
    return unwrapResponse<any>(response);
  },

  updateRole: async (id: string | number, roleData: Partial<Role>) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return unwrapResponse<any>(response);
  },

  deleteRole: async (id: string | number) => {
    const response = await api.delete(`/roles/${id}`);
    return unwrapResponse<any>(response);
  },

  getPermissions: async (roleId?: string | number) => {
    const params = roleId ? `?roleId=${roleId}` : '';
    const response = await api.get(`/roles/permissions${params}`);
    return unwrapResponse<any>(response);
  }
};
export default userService;
