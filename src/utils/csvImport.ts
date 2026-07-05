import Papa from 'papaparse';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  totalSpent: number;
  joined: string;
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  date: string;
  items: number;
}

export interface Discount {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  used: number;
  status: string;
  expiry: string;
}

/**
 * Parse CSV file using PapaParse
 */
const parseCSVFile = (file: File): Promise<Record<string, string>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as Record<string, string>[]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Import and validate Customer data from CSV
 */
export const importCustomers = async (file: File): Promise<ImportResult<Customer>> => {
  try {
    const rawData = await parseCSVFile(file);
    
    const customers: Customer[] = rawData.map((row: Record<string, string>, index: number) => ({
      id: index + 1,
      name: row.name || row.Name || row.customer_name || '',
      email: row.email || row.Email || '',
      phone: row.phone || row.Phone || row.mobile || '',
      city: row.city || row.City || row.location || '',
      orders: parseInt(row.orders || row.Orders || row.total_orders || '0') || 0,
      totalSpent: parseFloat(row.totalSpent || row['Total Spent'] || row.total_spent || row.amount || '0') || 0,
      joined: row.joined || row.Joined || row.date || row.registration_date || new Date().toISOString().split('T')[0]
    }));

    return {
      success: true,
      data: customers,
      count: customers.length
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import customers';
    return {
      success: false,
      error: message,
      data: [],
      count: 0
    };
  }
};

/**
 * Import and validate Order data from CSV
 */
export const importOrders = async (file: File): Promise<ImportResult<Order>> => {
  try {
    const rawData = await parseCSVFile(file);
    
    const orders: Order[] = rawData.map((row: Record<string, string>) => ({
      id: row.orderId || row.OrderId || row.order_id || row.id || row.Id || '',
      customer: row.customer || row.Customer || row.customer_name || row.customerName || '',
      email: row.email || row.Email || row.customer_email || '',
      total: parseFloat(row.total || row.Total || row.amount || row.Amount || '0') || 0,
      status: row.status || row.Status || row.order_status || 'Pending',
      date: row.date || row.Date || row.order_date || row.orderDate || new Date().toISOString().split('T')[0],
      items: parseInt(row.items || row.Items || row.quantity || row.Quantity || '1') || 1
    }));

    return {
      success: true,
      data: orders,
      count: orders.length
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import orders';
    return {
      success: false,
      error: message,
      data: [],
      count: 0
    };
  }
};

/**
 * Import and validate Discount data from CSV
 */
export const importDiscounts = async (file: File): Promise<ImportResult<Discount>> => {
  try {
    const rawData = await parseCSVFile(file);
    
    const discounts: Discount[] = rawData.map((row: Record<string, string>, index: number) => ({
      id: index + 1,
      code: row.code || row.Code || row.coupon_code || row.couponCode || '',
      type: row.type || row.Type || row.discount_type || 'Percentage',
      value: parseFloat(row.value || row.Value || row.discount || row.Discount || '0') || 0,
      minOrder: parseFloat(row.minOrder || row['Min Order'] || row.minimum_order || row.min_order || '0') || 0,
      maxDiscount: parseFloat(row.maxDiscount || row['Max Discount'] || row.maximum_discount || row.max_discount || '0') || 0,
      usageLimit: parseInt(row.usageLimit || row['Usage Limit'] || row.usage_limit || row.limit || '100') || 100,
      used: parseInt(row.used || row.Used || row.times_used || row.timesUsed || '0') || 0,
      status: row.status || row.Status || 'Active',
      expiry: row.expiry || row.Expiry || row.expiry_date || row.expiryDate || ''
    }));

    return {
      success: true,
      data: discounts,
      count: discounts.length
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import discounts';
    return {
      success: false,
      error: message,
      data: [],
      count: 0
    };
  }
};
