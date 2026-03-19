import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Save } from "lucide-react";

export default function Settings() {
  const [config, setConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await db.execute("SELECT * FROM store_config LIMIT 1");
      if (res.rows.length > 0) {
        setConfig(res.rows[0]);
      }
    } catch (error) {
      console.error("Failed to fetch store config:", error);
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Check if config exists
      const res = await db.execute("SELECT COUNT(*) as count FROM store_config");
      const exists = Number(res.rows[0]?.count || 0) > 0;
      
      if (exists) {
        await db.execute({
          sql: "UPDATE store_config SET store_name = ?, logo_url = ?, phone = ?, email = ?, address = ?, facebook_url = ?, instagram_url = ?",
          args: [
            config.store_name || "",
            config.logo_url || "",
            config.phone || "",
            config.email || "",
            config.address || "",
            config.facebook_url || "",
            config.instagram_url || ""
          ]
        });
      } else {
        await db.execute({
          sql: "INSERT INTO store_config (store_name, logo_url, phone, email, address, facebook_url, instagram_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [
            config.store_name || "",
            config.logo_url || "",
            config.phone || "",
            config.email || "",
            config.address || "",
            config.facebook_url || "",
            config.instagram_url || ""
          ]
        });
      }
      
      alert("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">اسم المتجر</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.store_name || ""}
              onChange={e => setConfig({...config, store_name: e.target.value})}
              placeholder="Kace Gaming"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">الشعار (رابط)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.logo_url || ""}
              onChange={e => setConfig({...config, logo_url: e.target.value})}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.phone || ""}
              onChange={e => setConfig({...config, phone: e.target.value})}
              placeholder="0555555555"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.email || ""}
              onChange={e => setConfig({...config, email: e.target.value})}
              placeholder="contact@example.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">العنوان</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.address || ""}
              onChange={e => setConfig({...config, address: e.target.value})}
              placeholder="الجزائر العاصمة..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">فيسبوك</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.facebook_url || ""}
              onChange={e => setConfig({...config, facebook_url: e.target.value})}
              placeholder="https://facebook.com/..."
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">إنستغرام</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={config.instagram_url || ""}
              onChange={e => setConfig({...config, instagram_url: e.target.value})}
              placeholder="https://instagram.com/..."
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
