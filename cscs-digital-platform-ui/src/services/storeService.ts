import api, { unwrapResponse } from './api';

export interface Store {
  storeId: string;
  storeName: string;
  address?: string;
  status?: string;
  externalStoreId?: string;
  contacts?: string;
  phone?: string;
  mailbox?: string;
  merchantName?: string;
  // Legacy alias used by some components
  id?: string;
}

export interface StoreResponseData {
  content: Store[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const storeService = {
  getAllStores: async (): Promise<Store[]> => {
    const response = await api.get('/stores/all');
    return unwrapResponse(response);
  },

  listStores: async (page = 0, size = 10, search?: string): Promise<StoreResponseData> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (search) params.append('search', search);
    const response = await api.get(`/stores?${params.toString()}`);
    return unwrapResponse(response);
  },

  addStore: async (storeData: Partial<Store>): Promise<void> => {
    const response = await api.post('/stores', storeData);
    unwrapResponse(response);
  },

  updateStore: async (id: string, storeData: Partial<Store>): Promise<void> => {
    const response = await api.put(`/stores/${id}`, storeData);
    unwrapResponse(response);
  },

  disableStore: async (id: string): Promise<void> => {
    const response = await api.put(`/stores/${id}/disable`);
    unwrapResponse(response);
  },

  enableStore: async (id: string): Promise<void> => {
    const response = await api.put(`/stores/${id}/enable`);
    unwrapResponse(response);
  },

  deleteStore: async (id: string): Promise<void> => {
    const response = await api.delete(`/stores/${id}`);
    unwrapResponse(response);
  },
};
export default storeService;
