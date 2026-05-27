import api, { unwrapResponse } from './api';

const mapStoreTerminology = (store: Store): Store => {
  if (store.storeName) {
    store.storeName = store.storeName
      .replace(/Branches/g, 'Stores')
      .replace(/branches/g, 'stores')
      .replace(/Branch/g, 'Store')
      .replace(/branch/g, 'store')
      .replace(/الفروع/g, 'المتاجر')
      .replace(/فروع/g, 'متاجر')
      .replace(/الفرع/g, 'المتجر')
      .replace(/فرع/g, 'متجر');
  }
  return store;
};

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
  comment?: string;
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
    const stores = unwrapResponse(response) as Store[];
    return stores.map(mapStoreTerminology);
  },

  listStores: async (page = 0, size = 10, search?: string): Promise<StoreResponseData> => {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (search) params.append('search', search);
    const response = await api.get(`/stores?${params.toString()}`);
    const data = unwrapResponse(response) as StoreResponseData;
    if (data && data.content) {
      data.content = data.content.map(mapStoreTerminology);
    }
    return data;
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

  getMerchantInfo: async (): Promise<any> => {
    try {
      const response = await api.get('/stores/merchant-info');
      return unwrapResponse(response);
    } catch {
      return null;
    }
  },

  getActiveStoreCount: async (): Promise<number> => {
    try {
      const response = await api.get('/stores/active-count');
      return unwrapResponse(response) ?? 0;
    } catch {
      return 0;
    }
  },
};
export default storeService;
