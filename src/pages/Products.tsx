import React, { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { Product, Category, ProductVariant } from '../types/supabase';
import { Plus, Edit, Trash2, Search, Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import ConfirmModal from '../components/ConfirmModal';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; images: string[]; isDeleting: boolean }>({
    isOpen: false, id: null, images: [], isDeleting: false
  });

  const [formData, setFormData] = useState({
    name_en: '',
    slug: '',
    description_en: '',
    price: '',
    original_price: '',
    stock: '',
    category_id: '',
    is_featured: false,
    is_new: true,
    is_sale: false,
    images: [] as string[],
    variants: [] as Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[],
  });

  function generateSlug(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.variants.length > 0) {
      const totalStock = formData.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      setFormData(prev => ({ ...prev, stock: totalStock.toString() }));
    }
  }, [formData.variants]);

  async function fetchData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        db.products.list(),
        db.categories.list(),
      ]);
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_en: product.name_en,
        slug: (product as any).slug || generateSlug(product.name_en),
        description_en: product.description_en || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        stock: product.stock.toString(),
        category_id: product.category_id || '',
        is_featured: product.is_featured,
        is_new: product.is_new,
        is_sale: product.is_sale,
        images: Array.isArray(product.image_url) ? product.image_url : [],
        variants: product.variants?.map(v => ({ name_en: v.name_en, name_ar: v.name_ar, stock: v.stock, image_url: v.image_url })) || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name_en: '', slug: '', description_en: '', price: '', original_price: '',
        stock: '0', category_id: '', is_featured: false, is_new: true, is_sale: false,
        images: [], variants: [],
      });
    }
    setIsModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const newImages = [...formData.images];
      for (let i = 0; i < e.target.files.length; i++) {
        const url = await uploadImage(e.target.files[i]);
        if (url) newImages.push(url);
      }
      setFormData(prev => ({ ...prev, images: newImages }));
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage(index: number) {
    const urlToRemove = formData.images[index];
    await deleteImage(urlToRemove);
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name_en.trim()) { toast.error('Name is required'); return; }
    if (!formData.price) { toast.error('Price is required'); return; }

    try {
      const productData = {
        name_ar: formData.name_en,
        name_en: formData.name_en,
        slug: formData.slug || generateSlug(formData.name_en),
        description_ar: formData.description_en,
        description_en: formData.description_en,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        stock: Number(formData.stock),
        category_id: formData.category_id || null,
        is_featured: formData.is_featured,
        is_new: formData.is_new,
        is_sale: formData.is_sale,
        image_url: formData.images,
        images: formData.images,
        variants: formData.variants,
      };

      if (editingProduct) {
        await db.products.update(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await db.products.create(productData);
        toast.success('Product created successfully');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function confirmDelete(product: Product) {
    setDeleteModal({ isOpen: true, id: product.id, images: Array.isArray(product.image_url) ? product.image_url : [], isDeleting: false });
  }

  async function handleDelete() {
    if (!deleteModal.id) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await db.products.delete(deleteModal.id);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (error: any) {
      if (error.message?.includes('foreign key')) {
        toast.error('لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات سابقة.', { duration: 6000 });
      } else {
        toast.error(error.message);
      }
    } finally {
      setDeleteModal({ isOpen: false, id: null, images: [], isDeleting: false });
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 transition-all"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">التصنيف</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">السعر</th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">المخزون</th>
                <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">مميز</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       <span>جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">لا توجد منتجات حالياً</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {Array.isArray(product.image_url) && product.image_url.length > 0 ? (
                          <img src={product.image_url[0]} alt={product.name_en} className="h-10 w-10 rounded-lg object-cover border border-gray-100 shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">بدون صورة</div>
                        )}
                        <div className="text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{product.name_en}</div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {product.category?.name_en || 'بدون تصنيف'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900">
                      {product.price} د.ج
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={product.stock <= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-[10px] font-bold rounded-full border ${
                        product.is_featured ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {product.is_featured ? 'مميز' : 'عادي'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(product)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name_en: name,
                      slug: generateSlug(name),
                    }));
                  }}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (د.ج)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Original Price</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${formData.variants.length > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                    الكمية
                    {formData.variants.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                        تُحسب من المتغيرات
                      </span>
                    )}
                  </label>
                  {formData.variants.length > 0 ? (
                    <div className="mt-1 flex items-center gap-2 border border-dashed border-gray-200 rounded-md py-2 px-3 bg-gray-50 cursor-not-allowed">
                      <span className="text-lg font-bold text-indigo-600">{formData.stock}</span>
                      <span className="text-xs text-gray-400">= مجموع كميات المتغيرات</span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { key: 'is_featured', label: 'مميز' },
                  { key: 'is_new', label: 'جديد' },
                  { key: 'is_sale', label: 'تخفيض' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[key as keyof typeof formData] as boolean}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="aspect-square flex justify-center items-center border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors relative">
                    <div className="text-center">
                      {uploading ? <Loader2 className="mx-auto h-8 w-8 text-indigo-600 animate-spin" /> : <Upload className="mx-auto h-8 w-8 text-gray-400" />}
                      <span className="mt-2 block text-sm font-medium text-gray-600">{uploading ? 'جاري الرفع...' : 'إضافة صورة'}</span>
                    </div>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-gray-900">Variables/Colors (Optional)</h3>
                   <button
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, variants: [...prev.variants, { name_en: '', name_ar: '', stock: 0, image_url: null }] }))}
                     className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-700"
                   >
                     <Plus className="w-4 h-4" />
                     Add Variant
                   </button>
                </div>
                <div className="space-y-4">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (variant.image_url) deleteImage(variant.image_url);
                          setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
                        }}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Variant Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Red / 16GB"
                            value={variant.name_en}
                            onChange={(e) => {
                               const newVariants = [...formData.variants];
                               newVariants[index].name_en = e.target.value;
                               newVariants[index].name_ar = e.target.value;
                               setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock === undefined ? '' : variant.stock}
                            onChange={(e) => {
                               const newVariants = [...formData.variants];
                               newVariants[index].stock = parseInt(e.target.value) || 0;
                               setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Variant Image</label>
                          {variant.image_url ? (
                            <div className="flex items-center gap-3">
                              <img src={variant.image_url} alt="Variant" className="h-10 w-10 rounded-md object-cover border border-gray-200" />
                              <button 
                                type="button" 
                                className="text-xs text-red-600 font-bold hover:underline"
                                onClick={() => {
                                  deleteImage(variant.image_url);
                                  const newVariants = [...formData.variants];
                                  newVariants[index].image_url = null;
                                  setFormData(prev => ({...prev, variants: newVariants}));
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 border border-gray-300 rounded-md py-1.5 px-3 cursor-pointer hover:bg-gray-100">
                              <Upload className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const url = await uploadImage(file);
                                  if (url) {
                                    const newVariants = [...formData.variants];
                                    newVariants[index].image_url = url;
                                    setFormData(prev => ({ ...prev, variants: newVariants }));
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="حذف المنتج"
        message="هل أنت متأكد أنك تريد حذف هذا المنتج؟ سيتم حذف صوره نهائياً."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, images: [], isDeleting: false })}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
