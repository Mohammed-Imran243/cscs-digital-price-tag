import api, { unwrapResponse } from './api';

// ── Existing Types ────────────────────────────────────────────────────────────

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

// ── Existing Service Object ───────────────────────────────────────────────────

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return unwrapResponse(response);
  }
};

// ── Sync Control Types ────────────────────────────────────────────────────────

export interface SyncStatusResponse {
  success: boolean;
  running: boolean;
  message: string;
}

// ── Sync Control Functions ────────────────────────────────────────────────────

/**
 * Fetches the current sync status from CSCS backend.
 * Called on page load to show correct button state.
 */
export const getSyncStatus = async (): Promise<SyncStatusResponse> => {
  const response = await api.get<SyncStatusResponse>('/api/sync/status');
  return response.data;
};

/**
 * Sends start command to CSCS backend → forwarded to TL's sync service.
 * Called when user clicks "Start Sync" button.
 */
export const startSync = async (): Promise<SyncStatusResponse> => {
  const response = await api.post<SyncStatusResponse>('/api/sync/start');
  return response.data;
};

/**
 * Sends stop command to CSCS backend → forwarded to TL's sync service.
 * Called when user clicks "Stop Sync" button.
 */
export const stopSync = async (): Promise<SyncStatusResponse> => {
  const response = await api.post<SyncStatusResponse>('/api/sync/stop');
  return response.data;
};