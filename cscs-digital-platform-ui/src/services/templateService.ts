import api, { unwrapResponse } from './api';

export interface Template {
  id: string;
  templateNumber: string;
  templateName: string;
  size: string;
  resolution: string;
  attrCategory: string;
  attrName: string;
  itemNum: number;
  modelList: string[];
  drawLayout: number; // 0 landscape, 1 portrait
  width: number;
  height: number;
  hardwareType: number; // 0 B/W, 1 B/W/R, 2 B/W/Y, 3 Multi
  createdTime: string;
  updateTime: string;
  tempPicUrl?: string;
  status?: string; // 1 = enabled, 0 = disabled
  storeId?: number;
}

export interface TemplateCategory {
  id: number;
  categoryName: string;
  agencyId?: number;
  merchantId?: number;
  storeId?: string;
  addTime?: string;
}

export interface PriceTagModel {
  id: number;
  size: string;
  model: string;
  oemModel: string;
  resolution: string;
  width: number;
  height: number;
  color: number;
  imgPath?: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface TemplateCreateRequest {
  templateName: string;
  storeId: string;
  model?: string;
  size?: string;
  resolution?: string;
  sceneNumber?: number;
}

export const getTemplates = async (page = 0, size = 10, searchParams?: Record<string, any>) => {
  const response = await api.post('/templates/list', searchParams || {}, {
    params: { page, size }
  });
  // Verify triple-nesting response.data.data.data from the backend
  const unwrapped = unwrapResponse<any>(response); // returns DragonTemplateListResponse (success/message/code/data)
  return unwrapped.data; // returns DragonTemplateData (content/totalPages/totalElements)
};

export const getCategories = async (): Promise<any[]> => {
  const response = await api.get('/templates/categories');
  return unwrapResponse(response);
};

export const getTemplateTypes = async (): Promise<any[]> => {
  const response = await api.get('/templates/types');
  return unwrapResponse(response);
};

export const addCategory = async (categoryName: string): Promise<void> => {
  const response = await api.post('/templates/categories', { categoryName });
  unwrapResponse(response);
};

export const getModels = async (): Promise<PriceTagModel[]> => {
  const response = await api.get('/templates/models');
  return unwrapResponse(response);
};

export const getTemplateById = async (id: string): Promise<Template> => {
  const response = await api.get(`/templates/${id}`);
  return unwrapResponse(response);
};

export const checkTemplateName = async (storeId: string, templateName: string): Promise<boolean> => {
  const response = await api.get(
    `/templates/check-name?storeId=${storeId}&templateName=${encodeURIComponent(templateName)}`
  );
  return unwrapResponse(response);
};

export const addTemplate = async (data: TemplateCreateRequest): Promise<void> => {
  const response = await api.post('/templates', data);
  unwrapResponse(response);
};

export const updateTemplateBase = async (id: string, data: Partial<Template>): Promise<void> => {
  const response = await api.put(`/templates/${id}`, data);
  unwrapResponse(response);
};

export const enableTemplate = async (id: string, status: string): Promise<void> => {
  const response = await api.put(`/templates/${id}/enable/${status}`);
  unwrapResponse(response);
};

export const deleteTemplate = async (id: string, storeId = '0', isCompel = false): Promise<void> => {
  const response = await api.delete(
    `/templates/${id}?storeId=${storeId}&isCompel=${isCompel}`
  );
  unwrapResponse(response);
};

export const getStoreIcons = async (page = 0, size = 10, searchParams?: Record<string, any>) => {
  const response = await api.post('/templates/icons/list', searchParams || {}, {
    params: { page, size }
  });
  return unwrapResponse<any>(response);
};
