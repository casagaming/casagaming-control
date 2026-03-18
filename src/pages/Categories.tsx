import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      toast.error('فشل في جلب التصنيفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
      try {
        await axios.delete(`/api/categories/${id}`);
        toast.success('تم حذف التصنيف بنجاح');
        fetchCategories();
      } catch (error) {
        toast.error('فشل في حذف التصنيف');
      }
    }
  };

  const openModal = (category = null) => {
    setCurrentCategory(category || { name_ar: '', name_en: '', slug: '', image_url: '' });
    setIsModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name_en = e.target.value;
    setCurrentCategory({
      ...currentCategory,
      name_en,
      slug: currentCategory.id ? currentCategory.slug : generateSlug(name_en)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCategory.id) {
        await axios.put(`/api/categories/${currentCategory.id}`, currentCategory);
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        await axios.post('/api/categories', currentCategory);
        toast.success('تم إضافة التصنيف بنجاح');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ التصنيف');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCurrentCategory({ ...currentCategory, image_url: res.data.url });
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل في رفع الصورة');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة تصنيف
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">الصورة</th>
                <th className="p-4 font-medium text-gray-500">الاسم (عربي)</th>
                <th className="p-4 font-medium text-gray-500">الاسم (إنجليزي)</th>
                <th className="p-4 font-medium text-gray-500">الرابط (Slug)</th>
                <th className="p-4 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category: any) => (
                <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name_ar} className="w-12 h-12 rounded-lg object-cover border border-gray-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{category.name_ar}</td>
                  <td className="p-4 text-gray-600">{category.name_en}</td>
                  <td className="p-4 text-gray-500 font-mono text-sm">{category.slug}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openModal(category)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentCategory.id ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (عربي)</label>
                <input required type="text" value={currentCategory.name_ar} onChange={e => setCurrentCategory({...currentCategory, name_ar: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي)</label>
                <input required type="text" value={currentCategory.name_en} onChange={handleNameEnChange} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرابط (Slug)</label>
                <input required type="text" value={currentCategory.slug} onChange={e => setCurrentCategory({...currentCategory, slug: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-left" dir="ltr" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة التصنيف</label>
                <div className="flex items-center gap-4">
                  {currentCategory.image_url ? (
                    <div className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                      <img src={currentCategory.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => setCurrentCategory({...currentCategory, image_url: ''})} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors cursor-pointer bg-gray-50">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-medium">رفع صورة</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">إلغاء</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
