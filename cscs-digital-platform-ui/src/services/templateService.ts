import api, { unwrapResponse } from './api';
import { apiCache, TTL } from './apiCache';

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
  color?: string;
  barCode?: string;
  sceneNumber?: number;
  screenType?: string;
  attrCategory?: string;
  attrName?: string;
}

export const getTemplates = async (page = 0, size = 10, searchParams?: Record<string, any>) => {
  const response = await api.post('/templates/list', searchParams || {}, {
    params: { page, size, pageNum: page, pageSize: size }
  });
  const unwrapped = unwrapResponse<any>(response); 
  
  let contentData: any = unwrapped;
  if (unwrapped && Array.isArray(unwrapped.content)) {
    contentData = unwrapped;
  } else if (unwrapped && unwrapped.data && Array.isArray(unwrapped.data.content)) {
    contentData = unwrapped.data;
  } else if (unwrapped.data) {
    contentData = unwrapped.data;
  }

  // Enrich with modelId and color from getTemplateById
  if (contentData && Array.isArray(contentData.content)) {
    const detailedContent = await Promise.all(
      contentData.content.map(async (t: any) => {
        try {
          // Fire and await all detail requests to get modelId which is omitted from list API
          const detail = await getTemplateById(t.id);
          return { ...t, modelId: detail.modelId };
        } catch (e) {
          return t;
        }
      })
    );
    contentData.content = detailedContent;
  }
  
  return contentData;
};

export const getCategories = async (): Promise<any[]> => {
  return apiCache.fetch(
    'templates:categories',
    async () => {
      const response = await api.get('/templates/categories');
      return unwrapResponse(response);
    },
    TTL.CATEGORIES
  );
};

export const getTemplateTypes = async (): Promise<any[]> => {
  return apiCache.fetch(
    'templates:types',
    async () => {
      const response = await api.get('/templates/types');
      return unwrapResponse(response);
    },
    TTL.TEMPLATE_TYPES
  );
};

export const addCategory = async (categoryName: string): Promise<void> => {
  const response = await api.post('/templates/categories', { categoryName });
  unwrapResponse(response);
};

export const getModels = async (): Promise<PriceTagModel[]> => {
  return apiCache.fetch(
    'templates:models',
    async () => {
      const response = await api.get('/templates/models');
      return unwrapResponse(response);
    },
    TTL.TEMPLATE_TYPES
  );
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

export const addTemplate = async (data: TemplateCreateRequest): Promise<any> => {
  const response = await api.post('/templates', data);
  return unwrapResponse<any>(response);
};

export const previewTemplate = async (data: TemplateCreateRequest): Promise<any> => {
  const response = await api.post('/templates/preview', data);
  return unwrapResponse<any>(response);
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

/**
 * Fetch all icons/components already associated with a template.
 * Calls GET /templates/{templateId}/findInTemp which proxies Dragon ESL's /zk/icon/findInTemp/{templateId}
 */
export const findIconsInTemplate = async (templateId: string): Promise<any[]> => {
  const response = await api.get(`/templates/${templateId}/findInTemp`);
  const data = unwrapResponse<any>(response);
  // data may be an array directly or wrapped
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.list)) return data.list;
  if (data && Array.isArray(data.content)) return data.content;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

/**
 * Add an icon/component to an existing template
 * Calls POST /templates/{templateId}/addIcon
 */
export const addIconToTemplate = async (templateId: string, iconData: any): Promise<any> => {
  const response = await api.post(`/templates/${templateId}/addIcon`, iconData);
  return unwrapResponse(response);
};

export const getFontTypes = async (): Promise<any[]> => {
  return apiCache.fetch('templates:fonts', async () => {
    const response = await api.get('/templates/fonts');
    return unwrapResponse<any[]>(response) || [];
  }, TTL.TEMPLATE_TYPES);
};

export const getMaxSubNum = async (storeId: string): Promise<any> => {
  const response = await api.get(`/templates/maxSubNum/${storeId}`);
  return unwrapResponse(response);
};

export const getPictureNames = async (storeId: string): Promise<any[]> => {
  const response = await api.get('/templates/itemPicName', { params: { storeId } });
  return unwrapResponse<any[]>(response) || [];
};

export const getFieldNames = async (type: string = '1'): Promise<any[]> => {
  return apiCache.fetch(`templates:fieldNames:${type}`, async () => {
    const response = await api.get(`/templates/fieldNames/${type}`);
    return unwrapResponse<any[]>(response) || [];
  }, TTL.TEMPLATE_TYPES);
};