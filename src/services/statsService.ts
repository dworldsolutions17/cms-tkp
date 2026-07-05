import api from './api';

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  todayRevenue: number;
  activeDiscounts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  recentOrders?: Array<{
    id: number;
    orderNumber: string;
    customer?: {
      id: number;
      name: string;
      email: string;
    };
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export const statsService = {
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
