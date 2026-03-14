import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Category } from '../types/supabase';
import { Plus, Edit, Trash2, Search, Upload, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import ConfirmModal from '../components/ConfirmModal';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; imageUrl: string | null; isDeleting: boolean }>({
    isOpen: false,
    id: null,
    imageUrl: null,
    isDeleting: false
  });

  const [formData, setFormData] = useState({
    name_en: '',
    slug: '',
    image_url: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name_en: category.name_en,
        slug: category.slug,
        image_url: category.image_url || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name_en: '',
        slug: '',
        image_url: '',
      });
    }
    setIsModalOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadImage(file);
      if (url) {
        // If replacing an existing image in the form, delete the old one from Cloudinary
        if (formData.image_url && formData.image_url !== editingCategory?.image_url) {
          await deleteImage(formData.image_url);
        }
        setFormData({ ...formData, image_url: url });
        toast.success('تم رفع الصورة بنجاح');
      } else {
        toast.error('فشل في رفع الصورة');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء الرفع: ' + (error.message || ''));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name_en.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      const generatedSlug = formData.name_en.trim().toLowerCase().replace(/\s+/g, '-');
      const categoryData = {
        name_ar: formData.name_en, // Auto-fill Arabic field with English to satisfy DB constraints
        name_en: formData.name_en,
        slug: formData.slug || generatedSlug,
        image_url: formData.image_url || null,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        
        // If the image was changed, delete the old one from Cloudinary
        if (editingCategory.image_url && editingCategory.image_url !== formData.image_url) {
          await deleteImage(editingCategory.image_url);
        }
        
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
        if (error) throw error;
        toast.success('Category created successfully');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function confirmDelete(category: Category) {
    setDeleteModal({
      isOpen: true,
      id: category.id,
      imageUrl: category.image_url,
      isDeleting: false
    });
  }

  async function handleDelete() {
    if (!deleteModal.id) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      // Delete image from Cloudinary first
      if (deleteModal.imageUrl) {
        await deleteImage(deleteModal.imageUrl);
      }
      
      // Delete from Supabase
      const { error } = await supabase.from('categories').delete().eq('id', deleteModal.id);
      if (error) throw error;
      
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteModal({ isOpen: false, id: null, imageUrl: null, isDeleting: false });
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">الأصناف</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث عن صنف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            إضافة صنف
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">الصورة</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       <span>جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">لا توجد أصناف حالياً</td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name_en} className="h-10 w-10 rounded-lg object-cover border border-gray-100 shadow-sm" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] font-bold">بدون صورة</div>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 truncate max-w-[120px] sm:max-w-none">{category.name_en}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(category)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(category)}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                {formData.image_url ? (
                  <div className="relative inline-block group">
                    <img src={formData.image_url} alt="Preview" className="h-32 w-32 object-cover rounded-xl border-2 border-gray-100 shadow-sm" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-2 text-center">
                       <button 
                         type="button" 
                         onClick={() => setFormData({ ...formData, image_url: '' })}
                         className="text-xs text-red-600 font-bold hover:underline"
                       >
                         تغيير الصورة
                       </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 w-full border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all group">
                    <div className="flex flex-col items-center justify-center py-5">
                      {uploading ? (
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                      ) : (
                        <Upload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      )}
                      <p className="mt-2 text-sm text-gray-600 font-medium">
                        {uploading ? 'جاري الرفع...' : 'اضغط لرفع صورة الصنف'}
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG, SVG</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={uploading}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="حذف التصنيف"
        message="هل أنت متأكد أنك تريد حذف هذا التصنيف؟ سيتم حذف الصورة المرتبطة به نهائياً ولن تتمكن من التراجع عن هذا الإجراء."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null, imageUrl: null, isDeleting: false })}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
