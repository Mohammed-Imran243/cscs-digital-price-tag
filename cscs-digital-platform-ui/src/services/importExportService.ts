import api from './api';

export interface ImportResponse {
  success: boolean;
  message: string;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    rowNumber: number;
    field: string;
    message: string;
  }>;
}

// ─── Product Import/Export ───────────────────────────────────────

export const importProducts = async (file: File, storeId?: string): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (storeId) formData.append('storeId', storeId);

  const response = await api.post('/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const exportProducts = async (storeId?: string): Promise<void> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await api.get(`/products/export${params}`, { responseType: 'blob' });
  downloadBlob(response.data, 'products.xlsx');
};

export const downloadProductImportTemplate = async (): Promise<void> => {
  const response = await api.get('/products/import-template', { responseType: 'blob' });
  downloadBlob(response.data, 'product_import_template.xlsx');
};

// ─── Store Import/Export ─────────────────────────────────────────

export const importStores = async (file: File): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/stores/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const exportStores = async (): Promise<void> => {
  const response = await api.get('/stores/export', { responseType: 'blob' });
  downloadBlob(response.data, 'stores.xlsx');
};

export const downloadStoreImportTemplate = async (): Promise<void> => {
  const response = await api.get('/stores/import-template', { responseType: 'blob' });
  downloadBlob(response.data, 'store_import_template.xlsx');
};

// ─── ESL Tag Import/Export ────────────────────────────────────────

export const importEslTags = async (file: File, storeId?: string): Promise<ImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (storeId) formData.append('storeId', storeId);

  const response = await api.post('/esl-tags/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const exportEslTags = async (storeId?: string): Promise<void> => {
  const params = storeId ? `?storeId=${storeId}` : '';
  const response = await api.get(`/esl-tags/export${params}`, { responseType: 'blob' });
  downloadBlob(response.data, 'esl-tags.xlsx');
};

export const downloadEslTagImportTemplate = async (): Promise<void> => {
  const response = await api.get('/esl-tags/import-template', { responseType: 'blob' });
  downloadBlob(response.data, 'esl_tag_import_template.xlsx');
};

// ─── Template Import/Export (ZIP) ────────────────────────────────

export const importTemplate = async (file: File, sceneNumber = '1'): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sceneNumber', sceneNumber);

  const response = await api.post('/templates/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const exportTemplates = async (templateBaseIds: number[], sceneNumber = '1'): Promise<void> => {
  const params = new URLSearchParams({ sceneNumber });
  templateBaseIds.forEach(id => params.append('templateBaseIds', id.toString()));

  const response = await api.get(`/templates/export?${params.toString()}`, { responseType: 'blob' });
  downloadBlob(response.data, 'templates.zip', 'application/zip');
};

// ─── Utility ─────────────────────────────────────────────────────

function downloadBlob(data: Blob, filename: string, mimeType?: string): void {
  const url = window.URL.createObjectURL(
    mimeType ? new Blob([data], { type: mimeType }) : data
  );
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
