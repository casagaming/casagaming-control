import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X } from "lucide-react";

export default function Shipping() {
  const [rates, setRates] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    wilaya_id: 1,
    wilaya_name_ar: "",
    wilaya_name_en: "",
    home_delivery_price: 0,
    desk_delivery_price: 0,
    return_price: 0,
    delivery_time: "",
  });

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const res = await db.execute("SELECT * FROM shipping_rates ORDER BY wilaya_id ASC");
      setRates(res.rows);
    } catch (error) {
      console.error("Failed to fetch shipping rates:", error);
    }
  }

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      wilaya_id: 1,
      wilaya_name_ar: "",
      wilaya_name_en: "",
      home_delivery_price: 0,
      desk_delivery_price: 0,
      return_price: 0,
      delivery_time: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rate: any) => {
    setEditingId(rate.id as number);
    setFormData({
      wilaya_id: rate.wilaya_id as number || 1,
      wilaya_name_ar: rate.wilaya_name_ar as string || "",
      wilaya_name_en: rate.wilaya_name_en as string || "",
      home_delivery_price: rate.home_delivery_price as number || 0,
      desk_delivery_price: rate.desk_delivery_price as number || 0,
      return_price: rate.return_price as number || 0,
      delivery_time: rate.delivery_time as string || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.execute({
          sql: "UPDATE shipping_rates SET wilaya_id = ?, wilaya_name_ar = ?, wilaya_name_en = ?, home_delivery_price = ?, desk_delivery_price = ?, return_price = ?, delivery_time = ? WHERE id = ?",
          args: [
            formData.wilaya_id,
            formData.wilaya_name_ar,
            formData.wilaya_name_en,
            formData.home_delivery_price,
            formData.desk_delivery_price,
            formData.return_price,
            formData.delivery_time,
            editingId
          ]
        });
      } else {
        await db.execute({
          sql: "INSERT INTO shipping_rates (wilaya_id, wilaya_name_ar, wilaya_name_en, home_delivery_price, desk_delivery_price, return_price, delivery_time) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [
            formData.wilaya_id,
            formData.wilaya_name_ar,
            formData.wilaya_name_en,
            formData.home_delivery_price,
            formData.desk_delivery_price,
            formData.return_price,
            formData.delivery_time
          ]
        });
      }
      setIsModalOpen(false);
      setFormData({
        wilaya_id: 1,
        wilaya_name_ar: "",
        wilaya_name_en: "",
        home_delivery_price: 0,
        desk_delivery_price: 0,
        return_price: 0,
        delivery_time: "",
      });
      setEditingId(null);
      fetchRates();
    } catch (error) {
      console.error("Failed to save shipping rate", error);
      alert("فشل حفظ سعر الشحن");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">أسعار الشحن</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة ولاية
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "تعديل سعر الشحن" : "إضافة سعر شحن"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="space-y-2 col-span-4">
                  <label className="text-sm font-medium text-gray-700">رقم الولاية</label>
                  <input 
                    type="number" required
                    value={formData.wilaya_id}
                    onChange={e => setFormData({...formData, wilaya_id: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2 col-span-4">
                  <label className="text-sm font-medium text-gray-700">الاسم (عربي)</label>
                  <input 
                    required
                    value={formData.wilaya_name_ar}
                    onChange={e => setFormData({...formData, wilaya_name_ar: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2 col-span-4">
                  <label className="text-sm font-medium text-gray-700">الاسم (إنجليزي)</label>
                  <input 
                    required
                    value={formData.wilaya_name_en}
                    onChange={e => setFormData({...formData, wilaya_name_en: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">توصيل للمنزل (د.ج)</label>
                  <input 
                    type="number" required
                    value={formData.home_delivery_price}
                    onChange={e => setFormData({...formData, home_delivery_price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">توصيل للمكتب (د.ج)</label>
                  <input 
                    type="number" required
                    value={formData.desk_delivery_price}
                    onChange={e => setFormData({...formData, desk_delivery_price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">سعر الإرجاع (د.ج)</label>
                  <input 
                    type="number" required
                    value={formData.return_price}
                    onChange={e => setFormData({...formData, return_price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">مدة التوصيل</label>
                  <input 
                    required
                    value={formData.delivery_time}
                    onChange={e => setFormData({...formData, delivery_time: e.target.value})}
                    placeholder="مثال: 2-3 أيام"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors">
                  {editingId ? "حفظ التعديلات" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">الولاية</th>
                <th className="px-6 py-4">توصيل للمنزل</th>
                <th className="px-6 py-4">توصيل للمكتب</th>
                <th className="px-6 py-4">سعر الإرجاع</th>
                <th className="px-6 py-4">مدة التوصيل</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد أسعار شحن
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr key={rate.id as number} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">
                      {rate.wilaya_id} - {rate.wilaya_name_ar}
                    </td>
                    <td className="px-6 py-4">{rate.home_delivery_price} د.ج</td>
                    <td className="px-6 py-4">{rate.desk_delivery_price} د.ج</td>
                    <td className="px-6 py-4">{rate.return_price} د.ج</td>
                    <td className="px-6 py-4">{rate.delivery_time}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => openEditModal(rate)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium ml-3"
                      >
                        تعديل
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("هل أنت متأكد من حذف سعر الشحن؟")) {
                            await db.execute({ sql: "DELETE FROM shipping_rates WHERE id = ?", args: [rate.id] });
                            fetchRates();
                          }
                        }}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
