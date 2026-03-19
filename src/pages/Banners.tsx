import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>(null);

  const fetchBanners = async () => {
    try {
      const res = await axios.get('/api/banners');
      setBanners(res.data);
    } catch (error) {
      toast.error('فشل في جلب البانرات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا البانر؟')) {
      try {
        await axios.delete(`/api/banners/${id}`);
        toast.success('تم حذف البانر بنجاح');
        fetchBanners();
      } catch (error) {
        toast.error('فشل في حذف البانر');
      }
    }
  };

  const openModal = (banner = null) => {
    setCurrentBanner(banner || { image_url: '', title: '', link_url: '', order_index: 0, is_active: true });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBanner.id) {
        await axios.put(`/api/banners/${currentBanner.id}`, currentBanner);
        toast.success('تم تحديث البانر بنجاح');
      } else {
        await axios.post('/api/banners', currentBanner);
        toast.success('تم إضافة البانر بنجاح');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ البانر');
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
      setCurrentBanner({ ...currentBanner, image_url: res.data.url });
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      toast.error('فشل في رفع الصورة');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة البانرات</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة بانر
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">الصورة</th>
                <th className="p-4 font-medium text-gray-500">العنوان</th>
                <th className="p-4 font-medium text-gray-500">الرابط</th>
                <th className="p-4 font-medium text-gray-500">الترتيب</th>
                <th className="p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner: any) => (
                <tr key={banner.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt={banner.title} className="w-24 h-12 rounded-lg object-cover border border-gray-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-24 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{banner.title || '-'}</td>
                  <td className="p-4 text-gray-500 font-mono text-sm" dir="ltr">{banner.link_url || '-'}</td>
                  <td className="p-4 text-gray-600">{banner.order_index}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${banner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {banner.is_active ? 'مفعّل' : 'معطّل'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openModal(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              <h2 className="text-xl font-bold">{currentBanner.id ? 'تعديل بانر' : 'إضافة بانر جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان (اختياري)</label>
                <input type="text" value={currentBanner.title} onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرابط عند الضغط (اختياري)</label>
                <input type="text" value={currentBanner.link_url} onChange={e => setCurrentBanner({...currentBanner, link_url: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left" dir="ltr" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                <input required type="number" value={currentBanner.order_index} onChange={e => setCurrentBanner({...currentBanner, order_index: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">صورة البانر</label>
                <div className="flex items-center gap-4">
                  {currentBanner.image_url ? (
                    <div className="relative w-full h-32 rounded-xl border border-gray-200 overflow-hidden group">
                      <img src={currentBanner.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button type="button" onClick={() => setCurrentBanner({...currentBanner, image_url: ''})} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors cursor-pointer bg-gray-50">
                      <ImageIcon className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">رفع صورة</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="is_active" checked={currentBanner.is_active} onChange={e => setCurrentBanner({...currentBanner, is_active: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">تفعيل البانر</label>
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
