import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload } from "lucide-react";
import { uploadImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import ConfirmModal from "@/components/ConfirmModal";

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    slug: "",
    image_url: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await db.execute("SELECT * FROM categories ORDER BY id DESC");
      setCategories(res.rows);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
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
    setFormData({ name_ar: "", name_en: "", slug: "", image_url: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingId(category.id as number);
    setFormData({
      name_ar: category.name_ar as string || "",
      name_en: category.name_en as string || "",
      slug: category.slug as string || "",
      image_url: category.image_url as string || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.execute({
          sql: "UPDATE categories SET name_ar = ?, name_en = ?, slug = ?, image_url = ? WHERE id = ?",
          args: [
            formData.name_ar,
            formData.name_en,
            formData.slug,
            formData.image_url,
            editingId
          ]
        });
      } else {
        await db.execute({
          sql: "INSERT INTO categories (name_ar, name_en, slug, image_url) VALUES (?, ?, ?, ?)",
          args: [
            formData.name_ar,
            formData.name_en,
            formData.slug,
            formData.image_url
          ]
        });
      }
      setIsModalOpen(false);
      setFormData({ name_ar: "", name_en: "", slug: "", image_url: "" });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category", error);
      alert("فشل حفظ التصنيف");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      const target = categories.find(c => c.id === deleteTargetId);
      if (target?.image_url) {
        await deleteCloudinaryImage(target.image_url as string);
      }
      await db.execute({ sql: "DELETE FROM categories WHERE id = ?", args: [deleteTargetId] });
      fetchCategories();
      setConfirmOpen(false);
    } catch {
      alert("فشل حذف التصنيف");
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة تصنيف
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "تعديل تصنيف" : "إضافة تصنيف جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (عربي)</label>
                <input 
                  required
                  value={formData.name_ar}
                  onChange={e => setFormData({...formData, name_ar: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (إنجليزي)</label>
                <input 
                  required
                  value={formData.name_en}
                  onChange={e => setFormData({...formData, name_en: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الرابط (Slug)</label>
                <input 
                  required
                  value={formData.slug}
                  onChange={e => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الصورة</label>
                <div className="flex gap-2">
                  {formData.image_url && (
                    <div className="relative group">
                      <img src={formData.image_url} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
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
                  {editingId ? "حفظ التعديلات" : "حفظ التصنيف"}
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
                <th className="px-6 py-4">الاسم (عربي)</th>
                <th className="px-6 py-4">الاسم (إنجليزي)</th>
                <th className="px-6 py-4">الرابط (Slug)</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    لا توجد تصنيفات
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id as number} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      {category.image_url ? (
                        <img src={category.image_url as string} alt={category.name_ar as string} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                          صورة
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{category.name_ar}</td>
                    <td className="px-6 py-4">{category.name_en}</td>
                    <td className="px-6 py-4">{category.slug}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium ml-3"
                      >
                        تعديل
                      </button>
                      <button 
                        onClick={() => { setDeleteTargetId(category.id as number); setConfirmOpen(true); }}
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

      <ConfirmModal
        isOpen={confirmOpen}
        title="حذف التصنيف"
        message="هل أنت متأكد من حذف هذا التصنيف؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
