import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Save } from "lucide-react";

export default function Settings() {
  const [config, setConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

      const res = await db.execute("SELECT COUNT(*) as count FROM store_config");
      const exists = Number(res.rows[0]?.count || 0) > 0;

      if (exists) {
        await db.execute({
          sql: `UPDATE store_config SET
            contact_phone = ?,
            contact_email = ?,
            contact_address = ?,
            facebook_url = ?,
            instagram_url = ?,
            twitter_url = ?,
            updated_at = datetime('now')`,
          args: [
            config.contact_phone || "",
            config.contact_email || "",
            config.contact_address || "",
            config.facebook_url || "",
            config.instagram_url || "",
            config.twitter_url || "",
          ],
        });
      } else {
        await db.execute({
          sql: `INSERT INTO store_config
            (contact_phone, contact_email, contact_address, facebook_url, instagram_url, twitter_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            config.contact_phone || "",
            config.contact_email || "",
            config.contact_address || "",
            config.facebook_url || "",
            config.instagram_url || "",
            config.twitter_url || "",
          ],
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save config:", error);
      alert("فشل حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: string, label: string, type = "text", placeholder = "", dir?: string, colSpan = 1) => (
    <div className={`space-y-2 ${colSpan === 2 ? "md:col-span-2" : ""}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
        value={config[key] || ""}
        onChange={e => setConfig({ ...config, [key]: e.target.value })}
        placeholder={placeholder}
        dir={dir}
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:opacity-90 transition-all font-medium disabled:opacity-50 text-white ${saved ? "bg-green-500" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          <Save className="w-5 h-5" />
          {isSaving ? "جاري الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ التغييرات"}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-8">
        {/* Contact */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">معلومات التواصل</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field("contact_phone", "رقم الهاتف", "text", "0555555555", "ltr")}
            {field("contact_email", "البريد الإلكتروني", "email", "contact@example.com", "ltr")}
            {field("contact_address", "العنوان", "text", "الجزائر العاصمة...", undefined, 2)}
          </div>
        </div>

        {/* Social */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">روابط التواصل الاجتماعي</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field("facebook_url", "فيسبوك", "text", "https://facebook.com/...", "ltr")}
            {field("instagram_url", "إنستغرام", "text", "https://instagram.com/...", "ltr")}
            {field("twitter_url", "تويتر / X", "text", "https://twitter.com/...", "ltr")}
          </div>
        </div>
      </div>
    </div>
  );
}
