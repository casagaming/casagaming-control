import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Link as LinkIcon,
  Type
} from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({
    is_active: true,
    image_url: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast.error('حدث خطأ أثناء تحميل البنرات: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setForm({ ...form, image_url: url });
        toast.success('تم رفع الصورة بنجاح');
      }
    } catch (error) {
      toast.error('فشل في رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url) {
      toast.error('يرجى اختيار صورة للبنر');
      return;
    }

    setLoading(true);
    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update({
            is_active: form.is_active,
            image_url: form.image_url
          })
          .eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('تم تحديث البنر بنجاح');
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([{
            is_active: form.is_active,
            image_url: form.image_url,
            order_index: banners.length
          }]);
        if (error) throw error;
        toast.success('تم إضافة البنر بنجاح');
      }
      closeModal();
      fetchBanners();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(banner: Banner) {
    if (!confirm('هل أنت متأكد من حذف هذا البنر؟')) return;

    try {
      // 1. Delete from Cloudinary
      await deleteImage(banner.image_url);
      
      // 2. Delete from Supabase
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', banner.id);
      
      if (error) throw error;
      toast.success('تم حذف البنر');
      fetchBanners();
    } catch (error: any) {
      toast.error('فشل في الحذف: ' + error.message);
    }
  }

  function openModal(banner: Banner | null = null) {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        is_active: banner.is_active,
        image_url: banner.image_url
      });
    } else {
      setEditingBanner(null);
      setForm({
        is_active: true,
        image_url: ''
      });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingBanner(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة البنرات</h1>
          <p className="text-sm text-gray-500 mt-1 text-right">تحكم في الصور المنزلقة المعروضة في الصفحة الرئيسية للمتجر.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold"
        >
          <Plus className="w-5 h-5" />
          إضافة بنر جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && banners.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            <span className="text-gray-500 font-medium">جاري تحميل البنرات...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-4 text-gray-400">
            <ImageIcon className="w-12 h-12" />
            <p className="font-bold">لا توجد بنرات حالياً</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden group hover:border-indigo-200 transition-all">
              <div className="relative aspect-[16/9] bg-gray-100">
                <img src={banner.image_url} alt={banner.title || ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => openModal(banner)}
                    className="p-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner)}
                    className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {!banner.is_active && (
                  <div className="absolute top-2 left-2 bg-gray-900/80 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    غير نشط
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-mono text-gray-400">#{banner.order_index}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBanner ? 'تعديل البنر' : 'إضافة بنر جديد'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 text-right">صورة البنر</label>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center group">
                  {form.image_url ? (
                    <>
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="p-2 bg-white text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors shadow-lg">
                          <ImageIcon className="w-5 h-5" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-indigo-500 transition-colors">
                      {uploading ? (
                        <>
                          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                          <span className="text-sm font-bold text-gray-500">جاري الرفع...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-10 h-10 text-gray-400" />
                          <span className="text-sm font-bold">رفع صورة</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-end gap-3 pt-2">
                  <span className="text-sm font-bold text-gray-700">تفعيل البنر</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingBanner ? 'حفظ التغييرات' : 'إضافة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
