import api from './api';

export interface Discount {
  id: number;
  code: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  used: number;
  status: 'Active' | 'Expired' | 'Inactive';
  expiry: string;
  createdAt: string;
  updatedAt: string;
}

export const discountService = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/discounts', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/discounts/${id}`);
    return response.data;
  },

  getByCode: async (code: string) => {
    const response = await api.get(`/discounts/code/${code}`);
    return response.data;
  },

  create: async (data: Partial<Discount>) => {
    const response = await api.post('/discounts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Discount>) => {
    const response = await api.put(`/discounts/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },

  exportToCSV: async () => {
    const response = await api.get('/discounts/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  importFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/discounts/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
