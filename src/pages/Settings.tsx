import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { uploadImage, deleteImage } from '../lib/cloudinary';
import { Upload, X, Loader2, Store, Phone, Mail, MapPin, Facebook, Instagram, Twitter, MessageCircle, Image as ImageIcon, Plus } from 'lucide-react';
import { StoreConfig } from '../types/supabase';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [config, setConfig] = useState<StoreConfig>({
    id: 1,
    store_name: 'CASA GAMING',
    logo_url: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_number: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        if (config.logo_url) {
          await deleteImage(config.logo_url);
        }
        setConfig({ ...config, logo_url: url });
        toast.success('تم رفع الشعار بنجاح');
      } else {
        toast.error('فشل في رفع الشعار');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error('حدث خطأ أثناء الرفع: ' + (error.message || ''));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    if (!config.logo_url) return;
    setUploadingLogo(true);
    try {
      await deleteImage(config.logo_url);
      setConfig({ ...config, logo_url: '' });
      toast.success('تم حذف الشعار');
    } catch (error) {
      toast.error('فشل في حذف الشعار');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('store_config')
        .upsert({ 
          ...config, 
          // Ensure we don't send hero_image_url if we've renamed it in DB
          updated_at: new Date().toISOString() 
        });
      
      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-6 h-6" />
          إعدادات المتجر
        </h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">هوية المتجر</h2>
          </div>
          <div className="p-6 space-y-8">
            <div className="max-w-md">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">اسم المتجر</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={config.store_name}
                    onChange={(e) => setConfig({ ...config, store_name: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold"
                    placeholder="Enter store name"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">قنوات التواصل</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={config.contact_phone || ''}
                    onChange={(e) => setConfig({ ...config, contact_phone: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="0555 XX XX XX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={config.contact_email || ''}
                    onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="support@store.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">العنوان</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={config.contact_address || ''}
                    onChange={(e) => setConfig({ ...config, contact_address: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Facebook className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">التواجد الاجتماعي</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رقم الواتساب</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={config.whatsapp_number || ''}
                    onChange={(e) => setConfig({ ...config, whatsapp_number: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="213XXXXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رابط فيسبوك</label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={config.facebook_url || ''}
                    onChange={(e) => setConfig({ ...config, facebook_url: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رابط انستقرام</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="url"
                    value={config.instagram_url || ''}
                    onChange={(e) => setConfig({ ...config, instagram_url: e.target.value })}
                    className="pl-10 block w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || uploadingLogo}
            className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 py-4 px-10 text-base font-black hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات المتجر'}
          </button>
        </div>
      </form>
    </div>
  );
}
