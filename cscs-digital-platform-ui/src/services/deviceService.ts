import api, { unwrapResponse } from './api';

export interface EslDevice {
  id: string;
  priceTagCode: string;
  oemModel: string;
  itemBarCode: string;
  itemTitle: string;
  state: 'ONLINE' | 'OFFLINE';
  battery: number;
  batteryLevel: number;
  bindState: number;
  apSignal: number;
  lastCommuTime?: string;
  updateTime?: string;
  bindTime?: string;
  storeId?: string;
}

export interface ApDevice {
  id: string;
  apName: string;
  mac: string;
  model: string;
  ip: string;
  eslCount: number;
  online: 'ONLINE' | 'OFFLINE' | 'UPGRADING' | 'UPGRADE_FAILED';
  rebootState?: number;
  softVersion?: string;
  joinTime?: string;
  storeId?: string;
}

export interface EslResponseData {
  content: EslDevice[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApResponseData {
  content: ApDevice[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const deviceService = {
  getEslDevices: async (page = 0, size = 10, storeId = '', search = ''): Promise<EslResponseData> => {
    const response = await api.get(`/devices/esl`, {
      params: { page, size, storeId, search }
    });
    return unwrapResponse(response);
  },

  getApDevices: async (page = 0, size = 10, storeId = '', search = ''): Promise<ApResponseData> => {
    const response = await api.get(`/devices/ap`, {
      params: { page, size, storeId, search }
    });
    return unwrapResponse(response);
  },

  rebootEsl: async (barcode: string): Promise<void> => {
    const response = await api.post(`/devices/esl/reboot?barcode=${barcode}`);
    unwrapResponse(response);
  },

  getEslDetail: async (barcode: string): Promise<any> => {
    const response = await api.get(`/devices/esl/detail?barcode=${barcode}`);
    return unwrapResponse(response);
  },

  forceRefreshEsl: async (storeId: string, barcodes: string[]): Promise<void> => {
    const response = await api.post(`/devices/esl/force-refresh?storeId=${storeId}`, barcodes);
    unwrapResponse(response);
  },

  /** Fetch unbound ESL devices for a store (used in Bind dialog dropdown) */
  getAvailableEslDevices: async (storeId: string): Promise<EslDevice[]> => {
    const response = await api.get(`/devices/esl/available`, { params: { storeId } });
    return unwrapResponse(response);
  },

  /** Bind an ESL to a product item barcode with optional AP MAC */
  bindEsl: async (payload: {
    storeId: string;
    itemBarCode: string;
    eslBarcode: string;
    apMac?: string;
  }): Promise<void> => {
    const response = await api.post(`/devices/esl/bind`, payload);
    unwrapResponse(response);
  },

  /** Unbind one or more ESL devices from their bound products */
  unbindEsl: async (storeId: string, eslBarcodes: string[]): Promise<void> => {
    const response = await api.post(`/devices/esl/unbind`, { storeId, eslBarcodes });
    unwrapResponse(response);
  },

  addAp: async (payload: {
    storeId: string;
    apName?: string;
    mac: string;
    comment?: string;
  }): Promise<void> => {
    const response = await api.post('/devices/ap/add', payload);
    unwrapResponse(response);
  },
};

export interface ApCreatePayload {
  storeId: string;
  apName?: string;
  mac: string;
  comment?: string;
}

export default deviceService;
