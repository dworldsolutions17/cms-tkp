import api from './api';

export interface InventoryItem {
  id: number;
  productId: number;
  quantity: number;
  location: string;
  sku?: string | null;
  incoming: number;
  unavailable: number;
  committed: number;
  available: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: number;
    name: string;
    price: string;
    stock: number;
    images?: string[];
  };
}

export interface AdjustInventoryDto {
  productId: number;
  quantity: number;
  reason: string;
}

export const inventoryService = {
  getAll: async (params?: { productId?: number; page?: number; limit?: number }) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  getByProductId: async (productId: number) => {
    const response = await api.get(`/inventory/product/${productId}`);
    return response.data;
  },

  getLowStock: async (threshold: number = 5) => {
    const response = await api.get(`/inventory/low-stock`, { params: { threshold } });
    return response.data;
  },

  getOutOfStock: async () => {
    const response = await api.get('/inventory/out-of-stock');
    return response.data;
  },

  getMovements: async (productId?: number) => {
    const response = await api.get('/inventory/movements', { params: productId ? { productId } : {} });
    return response.data;
  },

  create: async (data: Partial<InventoryItem>) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  adjustInventory: async (data: AdjustInventoryDto) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  },

  update: async (id: number, data: Partial<InventoryItem>) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },

  exportToCSV: async (): Promise<Blob> => {
    const response = await api.get('/inventory/export/csv', { responseType: 'blob' });
    return response.data;
  },

  importFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/inventory/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
