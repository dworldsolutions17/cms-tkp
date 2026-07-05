import api from './api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  images: string[];
  badge?: string;
  createdAt: string;
  updatedAt: string;
}

export const productService = {
  getAll: async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: Partial<Product>) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  exportToCSV: async (): Promise<Blob> => {
    const response = await api.get('/products/export/csv', { responseType: 'blob' });
    return response.data;
  },

  importFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/products/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
