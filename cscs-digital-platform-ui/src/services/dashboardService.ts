import api, { unwrapResponse } from './api';

export interface StoreBreakdown {
  storeId: string;
  storeName: string;
  productCount: number;
  apTotalCount: number;
  apOnlineCount: number;
}

export interface DashboardSummary {
  merchantCount: number;
  activeMerchantCount: number;
  storeCount: number;
  activeStoreCount: number;
  productCount: number;
  templateCount: number;
  categoryCount: number;
  apCount: number;
  eslCount: number;
  lastUpdated: string;
  storeBreakdowns: StoreBreakdown[];
}

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return unwrapResponse(response);
  }
};
