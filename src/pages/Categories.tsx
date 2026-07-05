import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Edit, Trash2, RefreshCw, Loader, X, FolderTree, Upload } from 'lucide-react';
import { categoryService, type Category } from '../services/categoryService';
import { uploadService } from '../services/uploadService';
import { formatDate } from '../utils/dateUtils';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const createImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();

      if (response?.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response?.items && Array.isArray(response.items)) {
        setCategories(response.items);
      } else if (Array.isArray(response)) {
        setCategories(response);
      } else {
        setCategories([]);
      }
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;

    return categories.filter((category) =>
      category.name.toLowerCase().includes(term) ||
      (category.description || '').toLowerCase().includes(term)
    );
  }, [categories, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: '',
    });
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      image: category.image || '',
    });
    setShowEditModal(true);
  };

  const handleOpenDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleUploadCategoryImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    mode: 'create' | 'edit',
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const oldUrl = mode === 'edit' ? selectedCategory?.image : undefined;
      const response = await uploadService.single(file, 'categories', oldUrl);
      setFormData((prev) => ({
        ...prev,
        image: response.url || '',
      }));
      setSuccessMessage('Category image uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload category image';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploadingImage(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      await categoryService.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image.trim() || undefined,
      });
      setSuccessMessage('Category created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowCreateModal(false);
      await fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCategory) return;

    try {
      setSaving(true);
      await categoryService.update(selectedCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image.trim() || undefined,
      });
      setSuccessMessage('Category updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditModal(false);
      await fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setError(message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setDeleting(true);
      await categoryService.delete(selectedCategory.id);
      setSuccessMessage('Category deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      await fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
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
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
        <p className="text-gray-600">Manage product categories for your catalog</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search category by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={fetchCategories}
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
              Add Category
            </button>
          </div>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No categories found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-gray-600 max-w-md">{category.description || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {category.image ? (
                        <img
                          src={uploadService.resolveUrl(category.image)}
                          alt={category.name}
                          className="w-10 h-10 object-cover rounded-md border border-gray-200"
                        />
                      ) : (
                        'No'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(category.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleOpenEditModal(category)}
                          className="text-green-600 hover:text-green-700"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(category)}
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
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Category</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={createImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadCategoryImage(e, 'create')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => createImageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className={`${uploadingImage ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}
                  >
                    {uploadingImage ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Image
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="/uploads/categories/your-image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Create Category'}
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

      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Category</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <div className="flex gap-2 mb-2">
                  <input
                    ref={editImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadCategoryImage(e, 'edit')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editImageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className={`${uploadingImage ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors`}
                  >
                    {uploadingImage ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Image
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="/uploads/categories/your-image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Update Category'}
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

      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Category</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedCategory.name}</strong>? This action cannot be undone.
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

export default Categories;
