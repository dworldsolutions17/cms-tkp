import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Loader,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { statsService, type DashboardStats } from '../services/statsService';
import api from '../services/api';

const dateFilters = [
  { label: 'All Time', period: 'all', revenueDays: 12 },
  { label: 'Today', period: 'today', revenueDays: 1 },
  { label: 'Last 7 Days', period: 'days', value: 7, revenueDays: 7 },
  { label: 'Last 30 Days', period: 'days', value: 30, revenueDays: 30 },
  { label: 'This Month', period: 'month', revenueDays: 30 },
  { label: 'This Year', period: 'year', revenueDays: 12 },
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    activeDiscounts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{period: string, revenue: number, orders: number}>>([]);
  const [dateFilter, setDateFilter] = useState(dateFilters[0]);

  useEffect(() => {
    fetchStats();
  }, [dateFilter]);

  const fetchStats = async () => {
    setLoading(true);
    const statsParams: { period?: string; value?: number } = {};
    if (dateFilter.period !== 'all') {
      statsParams.period = dateFilter.period;
      if (dateFilter.value) statsParams.value = dateFilter.value;
    }

    try {
      const response = await statsService.getDashboardStats(statsParams);
      
      // Handle response format (with or without data wrapper)
      const statsData = response.data || response;
      
      setStats({
        totalProducts: statsData.totalProducts || 0,
        totalOrders: statsData.totalOrders || 0,
        totalCustomers: statsData.totalCustomers || 0,
        totalRevenue: statsData.totalRevenue || 0,
        todayRevenue: statsData.todayRevenue || 0,
        activeDiscounts: statsData.activeDiscounts || 0,
        lowStockProducts: statsData.lowStockProducts || 0,
        outOfStockProducts: statsData.outOfStockProducts || 0,
        pendingOrders: statsData.pendingOrders || 0,
        completedOrders: statsData.completedOrders || 0,
        cancelledOrders: statsData.cancelledOrders || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }

    try {
      const revResponse = await api.get('/dashboard/revenue', { params: { period: 'monthly', days: dateFilter.revenueDays } });
      const responseBody = revResponse.data;
      const revData = responseBody?.data || responseBody || [];
      setRevenueData(Array.isArray(revData) ? revData : []);
      if (revData.length === 0) {
        console.log('No revenue data returned from API. Response:', responseBody);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue Trend Chart Configuration
  const revenueChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100],
      },
    },
    colors: ['#3b82f6', '#10b981'],
    xaxis: {
      categories: revenueData.length > 0
        ? revenueData.map(d => {
            const date = new Date(d.period);
            return date.toLocaleString('en-US', { month: 'short' });
          })
        : [],
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Revenue (PKR)',
        style: {
          color: '#6b7280',
        },
      },
      labels: {
        formatter: (value) => `${(value / 1000).toFixed(0)}K`,
        style: {
          colors: '#6b7280',
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `PKR ${value.toLocaleString()}`,
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      markers: {
        size: 6,
      },
    },
  };

  const revenueChartSeries = revenueData.length > 0
    ? [{ name: 'Revenue', data: revenueData.map(d => d.revenue || 0) }]
    : [];

  // Order Status Donut Chart Configuration
  const orderStatusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
    },
    labels: ['Completed', 'Pending', 'Cancelled'],
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Orders',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1f2937',
              formatter: () => stats.totalOrders.toString(),
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
      markers: {
        size: 6,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} orders`,
      },
    },
  };

  const orderStatusChartSeries = [stats.completedOrders, stats.pendingOrders, stats.cancelledOrders];

  // Product & Customer Bar Chart Configuration
  const statsBarChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 8,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
    xaxis: {
      categories: ['Products', 'Customers', 'Discounts', 'Low Stock'],
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Count',
        style: {
          color: '#6b7280',
        },
      },
      labels: {
        style: {
          colors: '#6b7280',
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (value) => `${value} items`,
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
  };

  const statsBarChartSeries = [
    {
      name: 'Total',
      data: [stats.totalProducts, stats.totalCustomers, stats.activeDiscounts, stats.lowStockProducts],
    },
  ];

  const filterLabel = dateFilter.label;
  const filteredSubtext = dateFilter.period === 'all' ? 'All time' : filterLabel;

  const statsDataCards = [
    { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'bg-blue-500', subtext: filteredSubtext },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-emerald-500', subtext: filteredSubtext },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-indigo-500', subtext: filteredSubtext },
    { label: 'Total Revenue', value: `PKR ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500', subtext: filteredSubtext },
    { label: 'Today Revenue', value: `PKR ${stats.todayRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-cyan-500', subtext: 'Today' },
    { label: 'Active Discounts', value: stats.activeDiscounts, icon: Tag, color: 'bg-purple-500', subtext: 'Running' },
    { label: 'Low Stock Items', value: stats.lowStockProducts, icon: AlertTriangle, color: 'bg-orange-500', subtext: 'Current' },
    { label: 'Out of Stock', value: stats.outOfStockProducts, icon: XCircle, color: 'bg-red-500', subtext: 'Current' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-blue-600', subtext: filteredSubtext },
    { label: 'Completed Orders', value: stats.completedOrders, icon: CheckCircle, color: 'bg-green-600', subtext: filteredSubtext },
    { label: 'Cancelled Orders', value: stats.cancelledOrders, icon: XCircle, color: 'bg-red-600', subtext: filteredSubtext },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to The Kidz Planet Admin Panel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={JSON.stringify({ period: dateFilter.period, value: dateFilter.value })}
              onChange={(e) => {
                const selected = dateFilters.find(
                  f => JSON.stringify({ period: f.period, value: (f as any).value }) === e.target.value
                );
                if (selected) setDateFilter(selected);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {dateFilters.map((f) => (
                <option
                  key={f.label}
                  value={JSON.stringify({ period: f.period, value: (f as any).value })}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Refresh Stats
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsDataCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wide">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h2>
            {revenueData.length > 0 ? (
              <ReactApexChart
                options={revenueChartOptions}
                series={revenueChartSeries}
                type="area"
                height={350}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No revenue data available</p>
                  <p className="text-sm mt-1">Completed orders will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/products" className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Manage Products</span>
              </Link>
              <Link to="/orders" className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900">View Orders</span>
              </Link>
              <Link to="/customers" className="flex items-center gap-3 p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
                <Users className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Manage Customers</span>
              </Link>
              <Link to="/inventory" className="flex items-center gap-3 p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">Inventory</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h2>
          <ReactApexChart
            options={orderStatusChartOptions}
            series={orderStatusChartSeries}
            type="donut"
            height={350}
          />
        </div>

        {/* Stats Overview Bar Chart */}
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Stats Overview</h2>
          <ReactApexChart
            options={statsBarChartOptions}
            series={statsBarChartSeries}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
