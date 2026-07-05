import api from './api';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customerId: number;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  total: number;
  status: string;
  rejectionReason?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
  items?: OrderItem[] | number;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderPayload {
  status?: string;
  rejectionReason?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
}

export const orderService = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: Partial<Order>) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async (id: number, data: UpdateOrderPayload) => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },

  exportToCSV: async () => {
    const response = await api.get('/orders/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  },

  importFromCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/orders/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
