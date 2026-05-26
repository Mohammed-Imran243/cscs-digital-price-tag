import api, { unwrapResponse } from './api';

export interface Product {
  id: string;
  barcode: string;
  itemName: string;
  price: string;
  originalPrice?: string;
  storeId: string;
  status: string;
  category?: string;
  unit?: string;
  attrCategory?: string;
  attrName?: string;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
}

export interface ProductCreateRequest {
  itemTitle: string;
  productCode?: string;
  barCode: string;
  price: number;
  originalPrice?: number;
  unit?: string;
  storeId: string;
  attrCategory?: string;
  attrName?: string;
}

export const getProducts = async (storeId: string, page = 0, size = 10, barcode?: string, search?: string): Promise<PagedResponse<Product>> => {
  const params = new URLSearchParams({ storeId, page: page.toString(), size: size.toString() });
  if (barcode) params.append('barcode', barcode);
  if (search) params.append('search', search);

  const response = await api.get(`/products?${params.toString()}`);
  return unwrapResponse(response);
};

export const createProduct = async (data: ProductCreateRequest): Promise<void> => {
  const response = await api.post('/products', data);
  unwrapResponse(response);
};

export const updateProductPrice = async (
  id: string,
  storeId: string,
  productData: {
    price: number;
    itemTitle?: string;
    productCode?: string;
    barCode?: string;
    originalPrice?: number;
    attrCategory?: string;
    attrName?: string;
    unit?: string;
  }
): Promise<void> => {
  const params = new URLSearchParams({ storeId });
  const response = await api.put(`/products/${id}/price?${params.toString()}`, productData);
  unwrapResponse(response);
};

export const deleteProductFromStore = async (id: string, storeId: string, barcode: string): Promise<void> => {
  const params = new URLSearchParams({ storeId, barcode });
  const response = await api.delete(`/products/${id}/store?${params.toString()}`);
  unwrapResponse(response);
};

export const deleteProductGlobal = async (id: string, barcode: string): Promise<void> => {
  const response = await api.delete(`/products/${id}/global`, { data: { barCode: barcode } });
  unwrapResponse(response);
};
