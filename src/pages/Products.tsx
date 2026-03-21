import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/db";
import { Plus, X, Upload, Package, Image as ImageIcon, AlertTriangle, Tag, Star, Sparkles, BadgePercent, Search } from "lucide-react";
import { uploadImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import ConfirmModal from "@/components/ConfirmModal";
import { useLanguage } from "@/lib/LanguageContext";

export default function Products() {
  const { t, lang } = useLanguage();
  const currency = lang === "fr" ? "DZD" : "د.ج";

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingVariantIdx, setUploadingVariantIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [variants, setVariants] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    name_ar: "",
    description_ar: "",
    price: "",
    original_price: "",
    stock: "",
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
      alert(t.upload_failed);
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name_ar: "", description_ar: "", price: "", original_price: "", stock: "", category_id: "", is_featured: false, is_new: true, is_sale: false, image_url: [] });
    setVariants([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (product: any) => {
    setEditingId(product.id as string);
    let images = [];
    try { images = JSON.parse(product.image_url as string || "[]"); } catch (e) {}
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
      const res = await db.execute({ sql: "SELECT * FROM product_variants WHERE product_id = ?", args: [product.id] });
      setVariants(res.rows.map(v => ({ id: v.id, name_ar: v.name_ar, stock: v.stock, image_url: v.image_url })));
    } catch { setVariants([]); }
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
      updateVariant(index, "image_url", url);
    } catch { alert(t.upload_failed); } finally { setUploadingVariantIdx(null); }
  };

  const variantsTotalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = `product-${Date.now()}`;
      const imagesStr = JSON.stringify(formData.image_url);
      const mainImageUrl = formData.image_url[0] || "";
      const finalStock = variants.length > 0 ? variantsTotalStock : Number(formData.stock) || 0;
      let productId = editingId;

      if (editingId) {
        await db.execute({
          sql: "UPDATE products SET name_ar = ?, name_en = ?, description_ar = ?, price = ?, original_price = ?, stock = ?, category_id = ?, is_featured = ?, is_new = ?, is_sale = ?, image_url = ?, images = ?, slug = ? WHERE id = ?",
          args: [formData.name_ar, formData.name_ar, formData.description_ar, Number(formData.price) || 0, Number(formData.original_price) || 0, finalStock, formData.category_id || null, formData.is_featured ? 1 : 0, formData.is_new ? 1 : 0, formData.is_sale ? 1 : 0, imagesStr, imagesStr, slug, editingId],
        });
        await db.execute({ sql: "DELETE FROM product_variants WHERE product_id = ?", args: [editingId] });
      } else {
        const res = await db.execute({
          sql: "INSERT INTO products (name_ar, name_en, description_ar, price, original_price, stock, category_id, is_featured, is_new, is_sale, image_url, images, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
          args: [formData.name_ar, formData.name_ar, formData.description_ar, Number(formData.price) || 0, Number(formData.original_price) || 0, finalStock, formData.category_id || null, formData.is_featured ? 1 : 0, formData.is_new ? 1 : 0, formData.is_sale ? 1 : 0, imagesStr, imagesStr, slug],
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
      setFormData({ name_ar: "", description_ar: "", price: "", original_price: "", stock: "", category_id: "", is_featured: false, is_new: true, is_sale: false, image_url: [] });
      setVariants([]);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product", error);
      alert(t.save_failed_product);
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeFilter === "low-stock") list = list.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10);
    else if (activeFilter === "out-of-stock") list = list.filter(p => Number(p.stock) === 0);
    else if (activeFilter === "featured") list = list.filter(p => Boolean(p.is_featured));
    else if (activeFilter === "new") list = list.filter(p => Boolean(p.is_new));
    else if (activeFilter === "sale") list = list.filter(p => Boolean(p.is_sale));
    else if (activeFilter.startsWith("cat:")) {
      const catId = activeFilter.replace("cat:", "");
      list = list.filter(p => String(p.category_id) === catId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => String(p.name_ar || "").toLowerCase().includes(q));
    }
    return list;
  }, [products, activeFilter, searchQuery]);

  const counts = useMemo(() => ({
    all: products.length,
    lowStock: products.filter(p => Number(p.stock) > 0 && Number(p.stock) < 10).length,
    outOfStock: products.filter(p => Number(p.stock) === 0).length,
    featured: products.filter(p => Boolean(p.is_featured)).length,
    isNew: products.filter(p => Boolean(p.is_new)).length,
    sale: products.filter(p => Boolean(p.is_sale)).length,
  }), [products]);

  const noResultsMsg = searchQuery
    ? (lang === "fr" ? `Aucun résultat pour "${searchQuery}"` : `لا توجد نتائج لـ "${searchQuery}"`)
    : activeFilter === "all"
      ? (lang === "fr" ? "Aucun produit" : "لا توجد منتجات")
      : (lang === "fr" ? "Aucun produit dans cette catégorie" : "لا توجد منتجات في هذا التصنيف");

  return (
    <div className="space-y-6 relative" dir={t.dir}>
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900 ml-auto">{t.products_title}</h1>
        <div className="relative">
          <Search className={`absolute ${t.dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none`} />
          <input
            type="text"
            placeholder={t.search_product}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`${t.dir === "rtl" ? "pr-9 pl-3" : "pl-9 pr-3"} py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-52`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute ${t.dir === "rtl" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          {t.add_product}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
          >
            <Package className="w-3.5 h-3.5" />
            {t.filter_all}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>{counts.all}</span>
          </button>

          {counts.outOfStock > 0 && (
            <button
              onClick={() => setActiveFilter("out-of-stock")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "out-of-stock" ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-700 border-red-200 hover:border-red-400"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.out_of_stock}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "out-of-stock" ? "bg-white/20 text-white" : "bg-red-200 text-red-700"}`}>{counts.outOfStock}</span>
            </button>
          )}

          {counts.lowStock > 0 && (
            <button
              onClick={() => setActiveFilter("low-stock")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "low-stock" ? "bg-orange-500 text-white border-orange-500" : "bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400"}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {t.low_stock_filter}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "low-stock" ? "bg-white/20 text-white" : "bg-orange-200 text-orange-700"}`}>{counts.lowStock}</span>
            </button>
          )}

          {categories.length > 0 && <div className="w-px bg-gray-200 self-stretch mx-1" />}

          {categories.map(cat => {
            const catCount = products.filter(p => String(p.category_id) === String(cat.id)).length;
            if (catCount === 0) return null;
            const key = `cat:${cat.id}`;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === key ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"}`}
              >
                <Tag className="w-3.5 h-3.5" />
                {cat.name_ar}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>{catCount}</span>
              </button>
            );
          })}

          <div className="w-px bg-gray-200 self-stretch mx-1" />

          {counts.featured > 0 && (
            <button onClick={() => setActiveFilter("featured")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "featured" ? "bg-yellow-500 text-white border-yellow-500" : "bg-yellow-50 text-yellow-700 border-yellow-200 hover:border-yellow-400"}`}>
              <Star className="w-3.5 h-3.5" />
              {t.featured}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "featured" ? "bg-white/20 text-white" : "bg-yellow-200 text-yellow-700"}`}>{counts.featured}</span>
            </button>
          )}

          {counts.isNew > 0 && (
            <button onClick={() => setActiveFilter("new")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "new" ? "bg-green-600 text-white border-green-600" : "bg-green-50 text-green-700 border-green-200 hover:border-green-400"}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {t.new_label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "new" ? "bg-white/20 text-white" : "bg-green-200 text-green-700"}`}>{counts.isNew}</span>
            </button>
          )}

          {counts.sale > 0 && (
            <button onClick={() => setActiveFilter("sale")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${activeFilter === "sale" ? "bg-pink-600 text-white border-pink-600" : "bg-pink-50 text-pink-700 border-pink-200 hover:border-pink-400"}`}>
              <BadgePercent className="w-3.5 h-3.5" />
              {t.sale}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeFilter === "sale" ? "bg-white/20 text-white" : "bg-pink-200 text-pink-700"}`}>{counts.sale}</span>
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? t.edit_product : t.add_new_product}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t.product_name}</label>
                <input
                  required
                  value={formData.name_ar}
                  onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t.description}</label>
                <textarea
                  value={formData.description_ar}
                  onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t.price}</label>
                  <input
                    type="number" required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t.original_price}</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={e => setFormData({ ...formData, original_price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    {t.stock}
                    {variants.length > 0 && <span className="text-xs text-indigo-500 mr-1">{t.calculated}</span>}
                  </label>
                  {variants.length > 0 ? (
                    <div className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50 rounded-xl text-sm text-indigo-700 font-medium">
                      {variantsTotalStock} {t.pieces}
                    </div>
                  ) : (
                    <input
                      type="number" required
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">{t.category}</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  >
                    <option value="">{t.no_category}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                {[
                  { key: "is_featured", label: t.featured },
                  { key: "is_new",      label: t.new_label },
                  { key: "is_sale",     label: t.sale },
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t.images}</label>
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

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{t.variants}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="text-xs flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    {t.add_variant}
                  </button>
                </div>

                {variants.map((variant, index) => (
                  <div key={variant.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0">
                        {variant.image_url ? (
                          <div className="relative group">
                            <img src={variant.image_url} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                            <button
                              type="button"
                              onClick={() => updateVariant(index, "image_url", "")}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors">
                            {uploadingVariantIdx === index ? <span className="text-xs">...</span> : <ImageIcon className="w-4 h-4" />}
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleVariantImageUpload(e, index)} disabled={uploadingVariantIdx !== null} />
                          </label>
                        )}
                      </div>
                      <input
                        placeholder={t.variant_name}
                        value={variant.name_ar}
                        onChange={e => updateVariant(index, "name_ar", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder={t.variant_stock}
                        value={variant.stock}
                        onChange={e => updateVariant(index, "stock", Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button type="button" onClick={() => removeVariant(index)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                  {t.cancel}
                </button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 text-sm">
                  {editingId ? t.save_changes : t.save_product}
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
                <th className="px-6 py-4">{t.category}</th>
                <th className="px-6 py-4">{t.price}</th>
                <th className="px-6 py-4">{t.stock}</th>
                <th className="px-6 py-4">{lang === "fr" ? "Statut" : "الحالة"}</th>
                <th className="px-6 py-4">{t.col_actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {noResultsMsg}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  let images: string[] = [];
                  try { images = JSON.parse(product.image_url as string || "[]"); } catch (e) {}
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
                      <td className="px-6 py-4 text-gray-500">{category ? category.name_ar : "-"}</td>
                      <td className="px-6 py-4">{product.price} {currency}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${Number(product.stock) === 0 ? "text-red-500" : Number(product.stock) < 5 ? "text-orange-500" : "text-gray-900"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {product.is_sale ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">{t.sale}</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">{lang === "fr" ? "Normal" : "عادي"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => openEditModal(product)} className="text-indigo-600 hover:text-indigo-900 font-medium ml-3">
                          {t.edit}
                        </button>
                        <button onClick={() => { setDeleteTargetId(product.id as string); setConfirmOpen(true); }} className="text-red-600 hover:text-red-900 font-medium">
                          {t.delete}
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

      <ConfirmModal
        isOpen={confirmOpen}
        title={lang === "fr" ? "Supprimer le produit" : "حذف المنتج"}
        message={lang === "fr" ? "Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible." : "هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف جميع بياناته ولا يمكن التراجع."}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          try {
            setIsDeleting(true);
            const target = products.find(p => p.id === deleteTargetId);
            if (target) {
              let imgs: string[] = [];
              try { imgs = JSON.parse(target.images || target.image_url || "[]"); } catch {}
              for (const url of imgs) { await deleteCloudinaryImage(url); }
              const variantsRes = await db.execute({ sql: "SELECT image_url FROM product_variants WHERE product_id = ? AND image_url != ''", args: [deleteTargetId] });
              for (const v of variantsRes.rows) { if (v.image_url) await deleteCloudinaryImage(v.image_url as string); }
            }
            await db.execute({ sql: "DELETE FROM product_variants WHERE product_id = ?", args: [deleteTargetId] });
            await db.execute({ sql: "DELETE FROM products WHERE id = ?", args: [deleteTargetId] });
            fetchProducts();
            setConfirmOpen(false);
          } catch {
            alert(lang === "fr" ? "Échec de la suppression du produit" : "فشل حذف المنتج");
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
