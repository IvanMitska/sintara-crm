/** Каталог товаров. Сверено с products.controller.ts. */
import type { ListResponse, Product } from '@/types';

import { api } from './client';

export interface ProductsFilter {
  skip?: number;
  take?: number;
  search?: string;
}

export interface ProductInput {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  currency?: string;
  unit?: string;
  isActive?: boolean;
}

export const productsApi = {
  /** GET /products — { data, total, skip, take }. */
  list: (filter?: ProductsFilter) =>
    api.get<ListResponse<Product>>('/products', { params: filter }).then((r) => r.data),

  byId: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),

  create: (data: ProductInput) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: (id: string, data: Partial<ProductInput>) =>
    api.patch<Product>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};
