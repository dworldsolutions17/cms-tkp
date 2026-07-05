import api from './api';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  address?: string;
  orders?: Array<{ id: number; orderNumber: string }>;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export const customerService = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: Partial<Customer>) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Customer>) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  exportToCSV: async () => {
    const response = await api.get('/customers/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  importFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customers/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
