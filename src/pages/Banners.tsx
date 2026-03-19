import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";

export default function Banners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    link_url: "",
    order_index: 0,
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    try {
      const res = await db.execute("SELECT * FROM banners ORDER BY order_index ASC");
      setBanners(res.rows);
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploading(true);
      const url = await uploadImage(e.target.files[0]);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ title: "", link_url: "", order_index: 0, is_active: true, image_url: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: any) => {
    setEditingId(banner.id as number);
    setFormData({
      title: banner.title as string || "",
      link_url: banner.link_url as string || "",
      order_index: banner.order_index as number || 0,
      is_active: Boolean(banner.is_active),
      image_url: banner.image_url as string || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.execute({
          sql: "UPDATE banners SET title = ?, link_url = ?, order_index = ?, is_active = ?, image_url = ? WHERE id = ?",
          args: [
            formData.title,
            formData.link_url,
            formData.order_index,
            formData.is_active ? 1 : 0,
            formData.image_url,
            editingId
          ]
        });
      } else {
        await db.execute({
          sql: "INSERT INTO banners (title, link_url, order_index, is_active, image_url) VALUES (?, ?, ?, ?, ?)",
          args: [
            formData.title,
            formData.link_url,
            formData.order_index,
            formData.is_active ? 1 : 0,
            formData.image_url
          ]
        });
      }
      setIsModalOpen(false);
      setFormData({ title: "", link_url: "", order_index: 0, is_active: true, image_url: "" });
      setEditingId(null);
      fetchBanners();
    } catch (error) {
      console.error("Failed to save banner", error);
      alert("فشل حفظ البانر");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة البانرات</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة بانر
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "تعديل بانر" : "إضافة بانر جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">العنوان</label>
                <input 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الرابط</label>
                <input 
                  value={formData.link_url}
                  onChange={e => setFormData({...formData, link_url: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">الترتيب</label>
                  <input 
                    type="number" required
                    value={formData.order_index}
                    onChange={e => setFormData({...formData, order_index: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">مفعل</span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الصورة</label>
                <div className="flex gap-2">
                  {formData.image_url && (
                    <div className="relative group">
                      <img src={formData.image_url} className="h-16 rounded-lg object-cover border border-gray-200" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                    {isUploading ? <span className="text-xs">جاري...</span> : <Upload className="w-5 h-5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                  إلغاء
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50">
                  {editingId ? "حفظ التعديلات" : "حفظ البانر"}
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
                <th className="px-6 py-4">الصورة</th>
                <th className="px-6 py-4">العنوان</th>
                <th className="px-6 py-4">الرابط</th>
                <th className="px-6 py-4">الترتيب</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد بانرات
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id as number} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      {banner.image_url ? (
                        <img src={banner.image_url as string} alt={banner.title as string} className="w-24 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-24 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          صورة
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{banner.title}</td>
                    <td className="px-6 py-4" dir="ltr">{banner.link_url}</td>
                    <td className="px-6 py-4">{banner.order_index}</td>
                    <td className="px-6 py-4">
                      {banner.is_active ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          مفعل
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          معطل
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => openEditModal(banner)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium ml-3"
                      >
                        تعديل
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("هل أنت متأكد من حذف هذا البانر؟")) {
                            await db.execute({ sql: "DELETE FROM banners WHERE id = ?", args: [banner.id] });
                            fetchBanners();
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
