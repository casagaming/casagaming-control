import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload, Package, Image as ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/cloudinary";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name_ar: "",
    description_ar: "",
    price: 0,
    original_price: 0,
    stock: 0,
    category_id: "",
    is_featured: false,
    is_new: true,
    is_sale: false,
    image_url: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await db.execute("SELECT id, name_ar FROM categories");
      setCategories(res.rows);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  async function fetchProducts() {
    try {
      const res = await db.execute("SELECT * FROM products ORDER BY id DESC");
      setProducts(res.rows);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploading(true);
      const url = await uploadImage(e.target.files[0]);
      setFormData(prev => ({ ...prev, image_url: [...prev.image_url, url] }));
    } catch (error) {
      console.error("Upload failed", error);
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name_ar: "",
      description_ar: "",
      price: 0,
      original_price: 0,
      stock: 0,
      category_id: "",
      is_featured: false,
      is_new: true,
      is_sale: false,
      image_url: [],
    });
    setVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (product: any) => {
    setEditingId(product.id as string);
    let images = [];
    try {
      images = JSON.parse(product.image_url as string || "[]");
    } catch (e) {}

    setFormData({
      name_ar: product.name_ar as string || "",
      description_ar: product.description_ar as string || "",
      price: product.price as number || 0,
      original_price: product.original_price as number || 0,
      stock: product.stock as number || 0,
      category_id: product.category_id as string || "",
      is_featured: Boolean(product.is_featured),
      is_new: Boolean(product.is_new),
      is_sale: Boolean(product.is_sale),
      image_url: images,
    });

    try {
      const res = await db.execute({
        sql: "SELECT * FROM product_variants WHERE product_id = ?",
        args: [product.id],
      });
      setVariants(res.rows.map(v => ({
        id: v.id,
        name_ar: v.name_ar,
        stock: v.stock,
        image_url: v.image_url,
      })));
    } catch (error) {
      setVariants([]);
    }

    setIsModalOpen(true);
  };

  const addVariant = () => {
    setVariants([...variants, { id: Math.random().toString(), name_ar: "", stock: 0, image_url: "" }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingVariantIdx(index);
      const url = await uploadImage(e.target.files[0]);
      updateVariant(index, 'image_url', url);
    } catch (error) {
      alert("فشل رفع الصورة");
    } finally {
      setUploadingVariantIdx(null);
    }
  };

  const variantsTotalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = `product-${Date.now()}`;
      const imagesStr = JSON.stringify(formData.image_url);
      const mainImageUrl = formData.image_url[0] || "";
      const finalStock = variants.length > 0 ? variantsTotalStock : formData.stock;

      let productId = editingId;

      if (editingId) {
        await db.execute({
          sql: "UPDATE products SET name_ar = ?, name_en = ?, description_ar = ?, price = ?, original_price = ?, stock = ?, category_id = ?, is_featured = ?, is_new = ?, is_sale = ?, image_url = ?, images = ?, slug = ? WHERE id = ?",
          args: [
            formData.name_ar,
            formData.name_ar,
            formData.description_ar,
            formData.price,
            formData.original_price,
            finalStock,
            formData.category_id || null,
            formData.is_featured ? 1 : 0,
            formData.is_new ? 1 : 0,
            formData.is_sale ? 1 : 0,
            imagesStr,
            imagesStr,
            slug,
            editingId,
          ],
        });

        await db.execute({
          sql: "DELETE FROM product_variants WHERE product_id = ?",
          args: [editingId],
        });
      } else {
        const res = await db.execute({
          sql: "INSERT INTO products (name_ar, name_en, description_ar, price, original_price, stock, category_id, is_featured, is_new, is_sale, image_url, images, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
          args: [
            formData.name_ar,
            formData.name_ar,
            formData.description_ar,
            formData.price,
            formData.original_price,
            finalStock,
            formData.category_id || null,
            formData.is_featured ? 1 : 0,
            formData.is_new ? 1 : 0,
            formData.is_sale ? 1 : 0,
            imagesStr,
            imagesStr,
            slug,
          ],
        });
        productId = res.rows[0].id as string;
      }

      for (const variant of variants) {
        if (variant.name_ar) {
          await db.execute({
            sql: "INSERT INTO product_variants (product_id, name_ar, name_en, stock, image_url) VALUES (?, ?, ?, ?, ?)",
            args: [productId, variant.name_ar, variant.name_ar, variant.stock, variant.image_url || ""],
          });
        }
      }

      setIsModalOpen(false);
      setFormData({
        name_ar: "",
        description_ar: "",
        price: 0,
        original_price: 0,
        stock: 0,
        category_id: "",
        is_featured: false,
        is_new: true,
        is_sale: false,
        image_url: [],
      });
      setVariants([]);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product", error);
      alert("فشل حفظ المنتج");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">اسم المنتج</label>
                <input
                  required
                  value={formData.name_ar}
                  onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">الوصف</label>
                <textarea
                  value={formData.description_ar}
                  onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
                />
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">السعر (د.ج)</label>
                  <input
                    type="number" required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">السعر الأصلي (د.ج)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={e => setFormData({ ...formData, original_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Stock + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    المخزون
                    {variants.length > 0 && <span className="text-xs text-indigo-500 mr-1">(محسوب)</span>}
                  </label>
                  {variants.length > 0 ? (
                    <div className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50 rounded-xl text-sm text-indigo-700 font-medium">
                      {variantsTotalStock} قطعة
                    </div>
                  ) : (
                    <input
                      type="number" required
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">التصنيف</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                {[
                  { key: "is_featured", label: "مميز" },
                  { key: "is_new", label: "جديد" },
                  { key: "is_sale", label: "تخفيض" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData as any)[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {/* Images */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">الصور</label>
                <div className="flex flex-wrap gap-2">
                  {formData.image_url.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: prev.image_url.filter((_, idx) => idx !== i) }))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
                    {isUploading ? <span className="text-xs">...</span> : <Upload className="w-4 h-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              {/* Variants */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">الأنواع</h3>
                    {variants.length > 0 && (
                      <p className="text-xs text-indigo-500">المخزون الإجمالي يُحسب تلقائياً من مجموع الأنواع</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    إضافة نوع
                  </button>
                </div>

                {variants.map((variant, index) => (
                  <div key={variant.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Image */}
                      <div className="shrink-0">
                        {variant.image_url ? (
                          <div className="relative group">
                            <img
                              src={variant.image_url}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => updateVariant(index, 'image_url', '')}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors">
                            {uploadingVariantIdx === index
                              ? <span className="text-xs">...</span>
                              : <ImageIcon className="w-4 h-4" />
                            }
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={e => handleVariantImageUpload(e, index)}
                              disabled={uploadingVariantIdx !== null}
                            />
                          </label>
                        )}
                      </div>

                      {/* Name */}
                      <input
                        placeholder="اسم النوع"
                        value={variant.name_ar}
                        onChange={e => updateVariant(index, 'name_ar', e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />

                      {/* Stock */}
                      <input
                        type="number"
                        placeholder="كمية"
                        value={variant.stock}
                        onChange={e => updateVariant(index, 'stock', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-400 hover:text-red-600 p-1 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                  إلغاء
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 text-sm">
                  {editingId ? "حفظ التعديلات" : "حفظ المنتج"}
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
                <th className="px-6 py-4">الاسم</th>
                <th className="px-6 py-4">التصنيف</th>
                <th className="px-6 py-4">السعر</th>
                <th className="px-6 py-4">المخزون</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  let images: string[] = [];
                  try {
                    images = JSON.parse(product.image_url as string || "[]");
                  } catch (e) {}
                  const category = categories.find(c => c.id === product.category_id);
                  return (
                    <tr key={product.id as number} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        {images[0] ? (
                          <img src={images[0]} alt={product.name_ar as string} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">{product.name_ar}</td>
                      <td className="px-6 py-4 text-gray-500">{category ? category.name_ar : '-'}</td>
                      <td className="px-6 py-4">{product.price} د.ج</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${Number(product.stock) === 0 ? 'text-red-500' : Number(product.stock) < 5 ? 'text-orange-500' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.is_sale ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">تخفيض</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">عادي</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium ml-3"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
                              await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [product.id] });
                              fetchProducts();
                            }
                          }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
