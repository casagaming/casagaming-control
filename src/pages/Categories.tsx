import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload, FolderOpen } from "lucide-react";
import { uploadImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import ConfirmModal from "@/components/ConfirmModal";
import { useLanguage } from "@/lib/LanguageContext";

export default function Categories() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", image_url: "" });

  useEffect(() => { fetchCategories(); }, []);

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
    } catch {
      alert(t.upload_failed);
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", image_url: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setEditingId(category.id as number);
    setFormData({
      name: (category.name_ar as string) || "",
      image_url: (category.image_url as string) || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = `category-${Date.now()}`;
    try {
      if (editingId) {
        await db.execute({
          sql: "UPDATE categories SET name_ar = ?, name_en = ?, image_url = ? WHERE id = ?",
          args: [formData.name, formData.name, formData.image_url, editingId],
        });
      } else {
        await db.execute({
          sql: "INSERT INTO categories (name_ar, name_en, slug, image_url) VALUES (?, ?, ?, ?)",
          args: [formData.name, formData.name, slug, formData.image_url],
        });
      }
      setIsModalOpen(false);
      setFormData({ name: "", image_url: "" });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category", error);
      alert(t.save_failed_category);
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
      alert(t.delete_failed_category);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-6 relative" dir={t.dir}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.categories_title}</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          {t.add_category}
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? t.edit_category : t.add_new_category}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t.category_name}</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.category_name_placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{t.image}</label>
                <div className="flex items-center gap-3">
                  {formData.image_url ? (
                    <div className="relative group">
                      <img src={formData.image_url} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors shrink-0">
                    {isUploading ? <span className="text-xs">{t.loading_image}</span> : <Upload className="w-5 h-5" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 text-sm">
                  {editingId ? t.save_changes : t.save_category}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ textAlign: t.dir === "rtl" ? "right" : "left" }}>
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">{t.col_image}</th>
                <th className="px-6 py-4">{t.col_name}</th>
                <th className="px-6 py-4">{t.col_actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    {t.no_categories}
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id as number} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      {category.image_url ? (
                        <img src={category.image_url as string} alt={category.name_ar as string} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <FolderOpen className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">{category.name_ar}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium ml-3"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => { setDeleteTargetId(category.id as number); setConfirmOpen(true); }}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        {t.delete}
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
        title={t.delete_category_title}
        message={t.delete_category_msg}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setConfirmOpen(false); setDeleteTargetId(null); }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
