import { useState, useEffect, useRef } from 'react';
import { Search, Eye, Loader, RefreshCw, Upload, Download, Trash2, X, Package, User, DollarSign } from 'lucide-react';
import { orderService, type Order } from '../services/orderService';
import Pagination from '../components/ui/Pagination';
import { formatDate, formatDateTime } from '../utils/dateUtils';

type ManageStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Rejected' | 'Cancelled';

const MANAGEABLE_STATUSES: ManageStatus[] = ['Pending', 'Processing', 'Shipped', 'Completed', 'Rejected', 'Cancelled'];

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusForm, setStatusForm] = useState({
    status: 'Pending' as ManageStatus,
    rejectionReason: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
  });

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; status?: string } = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }
      const response = await orderService.getAll(params);
      
      // Handle new paginated response format with data/meta
      if (response.data && response.meta) {
        setOrders(response.data);
        setTotalPages(response.meta.totalPages || 1);
        setTotalItems(response.meta.total || 0);
      } else if (response.items) {
        // Fallback for old format
        setOrders(response.items);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.total || 0);
      } else {
        // Fallback for array format
        setOrders(response);
        setTotalPages(1);
        setTotalItems(response.length);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await orderService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('Orders exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export orders';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await orderService.importFromCSV(file);
      setSuccessMessage(`Successfully imported ${result.imported || 0} orders!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import orders';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenDetailModal = async (order: Order) => {
    try {
      setStatusError('');
      const response = await orderService.getById(order.id);
      const fullOrder: Order = response?.data ?? response;
      setSelectedOrder(fullOrder);
      setStatusForm({
        status: MANAGEABLE_STATUSES.includes(fullOrder.status as ManageStatus)
          ? (fullOrder.status as ManageStatus)
          : 'Pending',
        rejectionReason: fullOrder.rejectionReason || '',
        trackingNumber: fullOrder.trackingNumber || '',
        trackingUrl: fullOrder.trackingUrl || '',
        estimatedDelivery: fullOrder.estimatedDelivery?.slice(0, 10) || '',
      });
      setShowDetailModal(true);
    } catch {
      setSelectedOrder(order);
      setStatusForm({
        status: MANAGEABLE_STATUSES.includes(order.status as ManageStatus)
          ? (order.status as ManageStatus)
          : 'Pending',
        rejectionReason: order.rejectionReason || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        estimatedDelivery: order.estimatedDelivery?.slice(0, 10) || '',
      });
      setShowDetailModal(true);
    }
  };

  const handleOpenDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    
    try {
      setDeleting(true);
      await orderService.delete(selectedOrder.id);
      setSuccessMessage('Order deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      await fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete order';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    if (statusForm.status === 'Rejected' && !statusForm.rejectionReason.trim()) {
      setStatusError('Please provide a rejection reason before rejecting this order.');
      return;
    }

    if (statusForm.status === 'Shipped' && !statusForm.trackingNumber.trim()) {
      setStatusError('Tracking number is required when status is Shipped.');
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError('');

      const payload = {
        status: statusForm.status.toLowerCase(),
        rejectionReason: statusForm.status === 'Rejected' ? statusForm.rejectionReason.trim() : null,
        trackingNumber:
          statusForm.status === 'Shipped' || statusForm.status === 'Completed'
            ? statusForm.trackingNumber.trim() || null
            : null,
        trackingUrl:
          statusForm.status === 'Shipped' || statusForm.status === 'Completed'
            ? statusForm.trackingUrl.trim() || null
            : null,
        estimatedDelivery:
          statusForm.status === 'Shipped' || statusForm.status === 'Completed'
            ? statusForm.estimatedDelivery || null
            : null,
        deliveredAt: statusForm.status === 'Completed' ? new Date().toISOString() : null,
      };

      await orderService.update(selectedOrder.id, payload);
      const refreshedResponse = await orderService.getById(selectedOrder.id);
      const refreshedOrder: Order = refreshedResponse?.data ?? refreshedResponse;
      setSelectedOrder(refreshedOrder);

      setStatusForm({
        status: MANAGEABLE_STATUSES.includes(refreshedOrder.status as ManageStatus)
          ? (refreshedOrder.status as ManageStatus)
          : statusForm.status,
        rejectionReason: refreshedOrder.rejectionReason || '',
        trackingNumber: refreshedOrder.trackingNumber || '',
        trackingUrl: refreshedOrder.trackingUrl || '',
        estimatedDelivery: refreshedOrder.estimatedDelivery?.slice(0, 10) || '',
      });

      setSuccessMessage(`Order #${selectedOrder.id} updated successfully.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      setStatusError(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Simple client-side search (backend search can be added later)
  const displayedOrders = searchTerm
    ? orders.filter(order => {
        const customerName = order.customer?.name || '';
        return order.id.toString().includes(searchTerm.toLowerCase()) ||
               customerName.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : orders;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error loading orders</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Management</h1>
        <p className="text-gray-600">View and manage all customer orders from database</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-800 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">{error}</p>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders by ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`${importing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              {importing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import CSV
                </>
              )}
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              className={`${exporting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            >
              {exporting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export CSV
                </>
              )}
            </button>

            <button 
              onClick={() => fetchOrders()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No orders found in database</p>
        </div>
      ) : (
        <>
          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{order.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{order.customer?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.customer?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {typeof order.items === 'number' 
                          ? order.items 
                          : Array.isArray(order.items) 
                          ? order.items.length 
                          : order.itemCount || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        Rs.{(order.total || 0).toLocaleString('en-PK')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDetailModal(order)}
                            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(order)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>

          {displayedOrders.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md mt-6">
              <p className="text-gray-500 text-lg">No orders found matching your criteria</p>
            </div>
          )}
        </>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <p className="text-gray-500">Order ID: #{selectedOrder.id}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Order Status</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Order Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              {/* Order Management */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3">Order Management</h3>

                {statusError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm font-semibold">{statusError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Update Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value as ManageStatus }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MANAGEABLE_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Estimated Delivery</label>
                    <input
                      type="date"
                      value={statusForm.estimatedDelivery}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {(statusForm.status === 'Shipped' || statusForm.status === 'Completed') && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tracking Number</label>
                        <input
                          type="text"
                          value={statusForm.trackingNumber}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                          placeholder="e.g. TCS-123456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Tracking URL (optional)</label>
                        <input
                          type="url"
                          value={statusForm.trackingUrl}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, trackingUrl: e.target.value }))}
                          placeholder="https://courier.example/track/..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {statusForm.status === 'Rejected' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Rejection Reason</label>
                      <textarea
                        value={statusForm.rejectionReason}
                        onChange={(e) => setStatusForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        rows={3}
                        placeholder="Enter reason why this order is rejected"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={updatingStatus}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg font-semibold disabled:bg-gray-400"
                  >
                    {updatingStatus ? 'Updating...' : 'Save Order Update'}
                  </button>
                </div>
              </div>

              {/* Customer Information */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.customer?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-gray-900">{selectedOrder.customer?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">Total Items</p>
                    <p className="font-semibold text-gray-900">
                      {typeof selectedOrder.items === 'number' 
                        ? selectedOrder.items 
                        : Array.isArray(selectedOrder.items) 
                        ? selectedOrder.items.length 
                        : selectedOrder.itemCount || 0} items</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900">PKR {(selectedOrder.total || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created At</p>
                  <p className="text-gray-700">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-gray-700">{formatDateTime(selectedOrder.updatedAt)}</p>
                </div>
              </div>

              {(selectedOrder.trackingNumber || selectedOrder.trackingUrl || selectedOrder.rejectionReason) && (
                <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                    <p className="text-gray-700">{selectedOrder.trackingNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tracking Link</p>
                    {selectedOrder.trackingUrl ? (
                      <a
                        href={selectedOrder.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open Tracking
                      </a>
                    ) : (
                      <p className="text-gray-700">N/A</p>
                    )}
                  </div>
                  {selectedOrder.rejectionReason && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Rejection Reason</p>
                      <p className="text-gray-700 bg-red-50 border border-red-100 rounded-lg p-3">{selectedOrder.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Order</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete order <strong>#{selectedOrder.id}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
