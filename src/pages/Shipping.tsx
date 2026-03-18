import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Shipping() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState<any>(null);

  const fetchRates = async () => {
    try {
      const res = await axios.get('/api/shipping-rates');
      setRates(res.data);
    } catch (error) {
      toast.error('فشل في جلب أسعار الشحن');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openModal = (rate: any) => {
    setCurrentRate(rate);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/shipping-rates/${currentRate.id}`, currentRate);
      toast.success('تم تحديث أسعار الشحن بنجاح');
      setIsModalOpen(false);
      fetchRates();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الأسعار');
    }
  };

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">أسعار الشحن</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">رقم الولاية</th>
                <th className="p-4 font-medium text-gray-500">الولاية</th>
                <th className="p-4 font-medium text-gray-500">توصيل للمنزل</th>
                <th className="p-4 font-medium text-gray-500">توصيل للمكتب</th>
                <th className="p-4 font-medium text-gray-500">سعر الإرجاع</th>
                <th className="p-4 font-medium text-gray-500">مدة التوصيل</th>
                <th className="p-4 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate: any) => (
                <tr key={rate.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-gray-500">{rate.wilaya_id}</td>
                  <td className="p-4 font-medium text-gray-900">{rate.wilaya_name_ar}</td>
                  <td className="p-4 font-bold text-indigo-600">{rate.home_delivery_price} د.ج</td>
                  <td className="p-4 font-bold text-indigo-600">{rate.desk_delivery_price} د.ج</td>
                  <td className="p-4 font-bold text-red-600">{rate.return_price} د.ج</td>
                  <td className="p-4 text-gray-600">{rate.delivery_time}</td>
                  <td className="p-4">
                    <button onClick={() => openModal(rate)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
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
              <h2 className="text-xl font-bold">تعديل أسعار الشحن - {currentRate.wilaya_name_ar}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سعر التوصيل للمنزل (د.ج)</label>
                <input required type="number" value={currentRate.home_delivery_price} onChange={e => setCurrentRate({...currentRate, home_delivery_price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سعر التوصيل للمكتب (د.ج)</label>
                <input required type="number" value={currentRate.desk_delivery_price} onChange={e => setCurrentRate({...currentRate, desk_delivery_price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سعر الإرجاع (د.ج)</label>
                <input required type="number" value={currentRate.return_price} onChange={e => setCurrentRate({...currentRate, return_price: Number(e.target.value)})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة التوصيل (مثال: 24-48 ساعة)</label>
                <input required type="text" value={currentRate.delivery_time} onChange={e => setCurrentRate({...currentRate, delivery_time: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
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
