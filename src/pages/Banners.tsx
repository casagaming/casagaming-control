import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload, Image } from "lucide-react";
import { uploadImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import ConfirmModal from "@/components/ConfirmModal";

export default function Banners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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
      setImageUrl(url);
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setImageUrl("");
    setIsModalOpen(true);
  };

  const openEditModal = (banner: any) => {
    setEditingId(banner.id as number);
    setImageUrl(banner.image_url as string || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert("الرجاء رفع صورة أولاً");
      return;
    }
    try {
      if (editingId) {
        await db.execute({
          sql: "UPDATE banners SET image_url = ? WHERE id = ?",
          args: [imageUrl, editingId],
        });
      } else {
        const maxOrderRes = await db.execute("SELECT MAX(order_index) as max_order FROM banners");
        const nextOrder = (Number(maxOrderRes.rows[0]?.max_order) || 0) + 1;
        await db.execute({
          sql: "INSERT INTO banners (title, link_url, order_index, is_active, image_url) VALUES (?, ?, ?, ?, ?)",
          args: ["", "", nextOrder, 1, imageUrl],
        });
      }
      setIsModalOpen(false);
      setImageUrl("");
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

      {/* Modal - image only */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "تعديل بانر" : "إضافة بانر جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">صورة البانر</label>
                {imageUrl ? (
                  <div className="relative group">
                    <img src={imageUrl} className="w-full h-40 rounded-xl object-cover border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-40 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors gap-2">
                    {isUploading ? (
                      <span className="text-sm">جاري الرفع...</span>
                    ) : (
                      <>
                        <Upload className="w-8 h-8" />
                        <span className="text-sm">اضغط لرفع الصورة</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                  إلغاء
                </button>
                <button type="submit" disabled={isUploading || !imageUrl} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 text-sm">
                  {editingId ? "حفظ التعديلات" : "حفظ البانر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            لا توجد بانرات
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id as number} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
              {banner.image_url ? (
                <img
                  src={banner.image_url as string}
                  alt="بانر"
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                  <Image className="w-8 h-8" />
                </div>
              )}
              <div className="p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">بانر #{banner.id}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(banner)}
                    className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => { setDeleteTargetId(banner.id as number); setConfirmOpen(true); }}
                    className="text-xs text-red-600 hover:text-red-900 font-medium"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="حذف البانر"
        message="هل أنت متأكد من حذف هذا البانر؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (!deleteTargetId) return;
          try {
            setIsDeleting(true);
            const target = banners.find(b => b.id === deleteTargetId);
            if (target?.image_url) {
              await deleteCloudinaryImage(target.image_url as string);
            }
            await db.execute({ sql: "DELETE FROM banners WHERE id = ?", args: [deleteTargetId] });
            fetchBanners();
            setConfirmOpen(false);
          } catch {
            alert("فشل حذف البانر");
          } finally {
            setIsDeleting(false);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
