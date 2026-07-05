import { useState, useEffect, useRef } from 'react';
import { Search, Mail, Phone, MapPin, Loader, Users, RefreshCw, Upload, Download, Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { customerService, type Customer } from '../services/customerService';
import Pagination from '../components/ui/Pagination';
import { formatDate, formatDateTime } from '../utils/dateUtils';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; search?: string } = {
        page: currentPage,
        limit: pageSize,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await customerService.getAll(params);
      
      // Handle new paginated response format with data/meta
      if (response.data && response.meta) {
        setCustomers(response.data);
        setTotalPages(response.meta.totalPages || 1);
        setTotalItems(response.meta.total || 0);
      } else if (response.items) {
        // Fallback for old format
        setCustomers(response.items);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.total || 0);
      } else {
        // Fallback for array format
        setCustomers(response);
        setTotalPages(1);
        setTotalItems(response.length);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await customerService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('Customers exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export customers';
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
      const result = await customerService.importFromCSV(file);
      setSuccessMessage(`Successfully imported ${result.imported || 0} customers!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchCustomers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import customers';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      address: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      address: customer.address || '',
    });
    setShowEditModal(true);
  };

  const handleOpenDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleOpenDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await customerService.create(formData);
      setSuccessMessage('Customer created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowCreateModal(false);      setCurrentPage(1);      await fetchCustomers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    try {
      setLoading(true);
      await customerService.update(selectedCustomer.id, formData);
      setSuccessMessage('Customer updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(false);
      await fetchCustomers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update customer';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      setDeleting(true);
      await customerService.delete(selectedCustomer.id);
      setSuccessMessage('Customer deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      await fetchCustomers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading customers from database...</p>
        </div>
      </div>
    );
  }

  if (error && !successMessage) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-semibold">Error loading customers</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers Management</h1>
        <p className="text-gray-600">View and manage customer information</p>
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
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex gap-3">            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>            <input
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
              onClick={() => fetchCustomers()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Customers Yet</h3>
          <p className="text-gray-600 mb-4">Start adding customers to your database</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">
                {customers.reduce((sum, c) => sum + (Array.isArray(c.orders) ? c.orders.length : 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600 mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                Rs.{customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString('en-PK')}
              </p>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {customer.city}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                        {Array.isArray(customer.orders) ? customer.orders.length : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                        Rs.{(customer.totalSpent || 0).toLocaleString('en-PK')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDetailModal(customer)}
                            className="text-green-600 hover:text-green-700" title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="text-blue-600 hover:text-blue-700" title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(customer)}
                            className="text-red-600 hover:text-red-700" title="Delete"
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

          {customers.length === 0 && !loading && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md mt-6">
              <p className="text-gray-500 text-lg">No customers found matching your search</p>
            </div>
          )}
        </>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Customer</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Updating...' : 'Update Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-2xl">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-500">Customer ID: {selectedCustomer.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">City</p>
                    <p className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedCustomer.city}
                    </p>
                  </div>
                  {selectedCustomer.address && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Address</p>
                      <p className="text-gray-900">{selectedCustomer.address}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {Array.isArray(selectedCustomer.orders) ? selectedCustomer.orders.length : 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">
                      PKR {(selectedCustomer.totalSpent || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Recent Orders</h4>
                  <div className="space-y-2">
                    {selectedCustomer.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                        <span className="text-sm text-gray-500">Order #{order.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Joined</p>
                  <p className="text-gray-700">{formatDateTime(selectedCustomer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                  <p className="text-gray-700">{formatDateTime(selectedCustomer.updatedAt)}</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEditModal(selectedCustomer);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Customer
                </button>
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
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Customer</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedCustomer.name}</strong>? This action cannot be undone.
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

export default Customers;
