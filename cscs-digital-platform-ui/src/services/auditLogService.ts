import api, { unwrapResponse } from './api';
import type { PagedResponse } from './productService';

export interface AuditLog {
  id: number;
  itemBarCode: string;
  itemName: string;
  price: string;
  priceTagBarCode: string;
  model: string;
  operation: number;
  operationText: string;
  status: number;
  statusText: string;
  operator: string;
  pushTime: string;
  feedbackTime: string;
  createdTime: string;
  operationLabel?: string;
  statusLabel?: string;
  storeId?: string;
  originalPrice?: string;
  discountAmount?: string;
}

export const getAuditLogs = async (
  storeId: string,
  startDate: string,
  endDate: string,
  page = 0,
  size = 10,
  operation?: number,
  status?: number
): Promise<PagedResponse<AuditLog>> => {
  const params = new URLSearchParams({
    storeId,
    startDate,
    endDate,
    page: page.toString(),
    size: size.toString(),
  });

  if (operation !== undefined) {
    params.append('operation', operation.toString());
  }

  if (status !== undefined) {
    params.append('status', status.toString());
  }

  const response = await api.get(`/audit-logs?${params.toString()}`);
  return unwrapResponse<PagedResponse<AuditLog>>(response);
};
