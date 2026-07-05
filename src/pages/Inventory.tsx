import { useState, useEffect, useRef } from 'react';
import { Search, Loader, Upload, Download, RefreshCw, AlertTriangle, Layers, TrendingDown, Plus, Edit, Trash2, X } from 'lucide-react';
import { inventoryService, type InventoryItem } from '../services/inventoryService';
import { productService, type Product } from '../services/productService';
import Pagination from '../components/ui/Pagination';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'out'>('all');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [adjustingId, setAdjustingId] = useState<number | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    location: '',
    sku: '',
    incoming: '',
    unavailable: '',
    committed: '',
  });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll({});
      // Handle new format with data/meta
      const productsList = response.data ? response.data : (response.items ? response.items : response);
      setProducts(Array.isArray(productsList) ? productsList : []);
    } catch (err: unknown) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      const response = await inventoryService.getAll(params);
      
      // Handle new paginated response format with data/meta
      if (response.data && response.meta) {
        setInventory(response.data);
        setTotalPages(response.meta.totalPages || 1);
        setTotalItems(response.meta.total || 0);
      } else if (response.items) {
        // Fallback for old format
        setInventory(response.items);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.total || 0);
      } else {
        // Fallback for array format
        setInventory(response);
        setTotalPages(1);
        setTotalItems(response.length);
      }
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await inventoryService.exportToCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage('Inventory exported successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export inventory';
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
      const result = await inventoryService.importFromCSV(file);
      setSuccessMessage(`Successfully imported ${result.imported || 0} inventory records!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchInventory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import inventory';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAdjustInventory = async (id: number) => {
    if (!adjustQuantity || !adjustReason) {
      setError('Please enter quantity and reason');
      return;
    }

    try {
      const item = inventory.find(inv => inv.id === id);
      if (!item) return;

      await inventoryService.adjustInventory({
        productId: item.productId,
        quantity: parseInt(adjustQuantity),
        reason: adjustReason,
      });

      setSuccessMessage('Inventory adjusted successfully!');
      setAdjustingId(null);
      setAdjustQuantity('');
      setAdjustReason('');
      setTimeout(() => setSuccessMessage(''), 3000);
      await fetchInventory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to adjust inventory';
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      productId: '',
      quantity: '',
      location: '',
      sku: '',
      incoming: '',
      unavailable: '',
      committed: '',
    });
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      productId: item.productId.toString(),
      quantity: item.quantity.toString(),
      location: item.location,
      sku: item.sku || '',
      incoming: item.incoming.toString(),
      unavailable: item.unavailable.toString(),
      committed: item.committed.toString(),
    });
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const inventoryData = {
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        location: formData.location,
        sku: formData.sku || undefined,
        incoming: parseInt(formData.incoming) || 0,
        unavailable: parseInt(formData.unavailable) || 0,
        committed: parseInt(formData.committed) || 0,
      };
      await inventoryService.create(inventoryData);
      setSuccessMessage('Inventory item created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowCreateModal(false);
      setCurrentPage(1);
      await fetchInventory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create inventory item';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      setLoading(true);
      const inventoryData = {
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        location: formData.location,
        sku: formData.sku || undefined,
        incoming: parseInt(formData.incoming) || 0,
        unavailable: parseInt(formData.unavailable) || 0,
        committed: parseInt(formData.committed) || 0,
      };
      await inventoryService.update(selectedItem.id, inventoryData);
      setSuccessMessage('Inventory item updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(false);
      await fetchInventory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update inventory item';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      setDeleting(true);
      await inventoryService.delete(selectedItem.id);
      setSuccessMessage('Inventory item deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      await fetchInventory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete inventory item';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeleting(false);
    }
  };

  // Tab-based filtering (client-side)
  const getLowStockItems = () => inventory.filter(item => item.quantity > 0 && item.quantity <= 5);
  const getOutOfStockItems = () => inventory.filter(item => item.quantity === 0);

  const displayedInventory = 
    activeTab === 'low' ? getLowStockItems() :
    activeTab === 'out' ? getOutOfStockItems() :
    inventory;

  // Search filtering (client-side)
  const filteredInventory = searchTerm
    ? displayedInventory.filter(item =>
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : displayedInventory;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Track and manage product stock levels</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Total Items
          </p>
          <p className="text-3xl font-bold text-gray-900">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Low Stock
          </p>
          <p className="text-3xl font-bold text-yellow-600">{getLowStockItems().length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Out of Stock
          </p>
          <p className="text-3xl font-bold text-red-600">{getOutOfStockItems().length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 mb-2">Total Units</p>
          <p className="text-3xl font-bold text-gray-900">
            {inventory.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            All Items ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('low')}
            className={`flex-1 px-6 py-4 font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'low' 
                ? 'border-yellow-600 text-yellow-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Low Stock ({getLowStockItems().length})
          </button>
          <button
            onClick={() => setActiveTab('out')}
            className={`flex-1 px-6 py-4 font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'out' 
                ? 'border-red-600 text-red-600' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Out of Stock ({getOutOfStockItems().length})
          </button>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
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
              onClick={() => fetchInventory()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Available</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-xs text-gray-500">ID: {item.productId}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-lg">{item.quantity} units</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-green-600">{item.available} units</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600">{item.location || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>Incoming: {item.incoming}</p>
                    <p>Committed: {item.committed}</p>
                    <p>Unavailable: {item.unavailable}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.quantity === 0 ? 'bg-red-100 text-red-700' :
                      item.quantity <= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.quantity === 0 ? 'Out of Stock' :
                       item.quantity <= 5 ? 'Low Stock' :
                       'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {adjustingId === item.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={adjustQuantity}
                          onChange={(e) => setAdjustQuantity(e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <select
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Reason</option>
                          <option value="Restock">Restock</option>
                          <option value="Damage">Damage</option>
                          <option value="Adjustment">Adjustment</option>
                          <option value="Loss">Loss</option>
                        </select>
                        <button
                          onClick={() => handleAdjustInventory(item.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAdjustingId(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded text-sm hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAdjustingId(item.id)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Adjust Stock"
                        >
                          <TrendingDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-green-600 hover:text-green-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(item)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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

      {filteredInventory.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md mt-6">
          <p className="text-gray-500 text-lg">No inventory items found</p>
        </div>
      )}

      {/* Create Inventory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Inventory Item</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Warehouse A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Stock Keeping Unit"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incoming</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.incoming}
                    onChange={(e) => setFormData({...formData, incoming: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Committed</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.committed}
                    onChange={(e) => setFormData({...formData, committed: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unavailable</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unavailable}
                    onChange={(e) => setFormData({...formData, unavailable: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Creating...' : 'Create Item'}
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

      {/* Edit Inventory Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Inventory Item</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incoming</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.incoming}
                    onChange={(e) => setFormData({...formData, incoming: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Committed</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.committed}
                    onChange={(e) => setFormData({...formData, committed: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unavailable</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unavailable}
                    onChange={(e) => setFormData({...formData, unavailable: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {loading ? 'Updating...' : 'Update Item'}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Inventory Item</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete inventory for <strong>{selectedItem.product?.name}</strong>? This action cannot be undone.
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

export default Inventory;
