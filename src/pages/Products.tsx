import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data);
    } catch (error) {
      toast.error('فشل في جلب المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await axios.delete(`/api/products/${id}`);
        toast.success('تم حذف المنتج بنجاح');
        fetchProducts();
      } catch (error) {
        toast.error('فشل في حذف المنتج');
      }
    }
  };

  const openModal = (product = null) => {
    setCurrentProduct(product || {
      name_ar: '', name_en: '', description_ar: '', description_en: '',
      price: 0, original_price: 0, image_url: [], category_id: '',
      stock: 0, is_featured: false, is_new: false, is_sale: false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct.id) {
        await axios.put(`/api/products/${currentProduct.id}`, currentProduct);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await axios.post('/api/products', currentProduct);
        toast.success('تم إضافة المنتج بنجاح');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ المنتج');
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
      setCurrentProduct({
        ...currentProduct,
        image_url: [...(currentProduct.image_url || []), res.data.url]
      });
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل في رفع الصورة');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">الصورة</th>
                <th className="p-4 font-medium text-gray-500">الاسم</th>
                <th className="p-4 font-medium text-gray-500">السعر</th>
                <th className="p-4 font-medium text-gray-500">المخزون</th>
                <th className="p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => {
                const images = typeof product.image_url === 'string' ? JSON.parse(product.image_url) : product.image_url;
                return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      {images && images.length > 0 ? (
                        <img src={images[0]} alt={product.name_ar} className="w-12 h-12 rounded-lg object-cover border border-gray-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{product.name_ar}</td>
                    <td className="p-4 font-bold text-indigo-600">{product.price} د.ج</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? `${product.stock} متوفر` : 'نفذ الكمية'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {product.is_featured === 1 && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">مميّز</span>}
                        {product.is_new === 1 && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">جديد</span>}
                        {product.is_sale === 1 && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">تخفيض</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentProduct.id ? 'تعديل منتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (عربي)</label>
                  <input required type="text" value={currentProduct.name_ar} onChange={e => setCurrentProduct({...currentProduct, name_ar: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الاسم (إنجليزي)</label>
                  <input required type="text" value={currentProduct.name_en} onChange={e => setCurrentProduct({...currentProduct, name_en: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الوصف (عربي)</label>
                  <textarea rows={3} value={currentProduct.description_ar} onChange={e => setCurrentProduct({...currentProduct, description_ar: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر الحالي</label>
                  <input required type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأصلي (قبل التخفيض)</label>
                  <input type="number" value={currentProduct.original_price} onChange={e => setCurrentProduct({...currentProduct, original_price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                  <select required value={currentProduct.category_id} onChange={e => setCurrentProduct({...currentProduct, category_id: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    <option value="">اختر تصنيفاً</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المخزون</label>
                  <input required type="number" value={currentProduct.stock} onChange={e => setCurrentProduct({...currentProduct, stock: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صور المنتج</label>
                <div className="flex gap-4 flex-wrap mb-4">
                  {(typeof currentProduct.image_url === 'string' ? JSON.parse(currentProduct.image_url) : currentProduct.image_url || []).map((url: string, i: number) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => {
                          const newImages = [...(typeof currentProduct.image_url === 'string' ? JSON.parse(currentProduct.image_url) : currentProduct.image_url)];
                          newImages.splice(i, 1);
                          setCurrentProduct({...currentProduct, image_url: newImages});
                        }}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors cursor-pointer bg-gray-50">
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">إضافة صورة</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="flex gap-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={currentProduct.is_featured} onChange={e => setCurrentProduct({...currentProduct, is_featured: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">منتج مميّز</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={currentProduct.is_new} onChange={e => setCurrentProduct({...currentProduct, is_new: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">منتج جديد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={currentProduct.is_sale} onChange={e => setCurrentProduct({...currentProduct, is_sale: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">منتج في تخفيض</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors">إلغاء</button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm">حفظ المنتج</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
