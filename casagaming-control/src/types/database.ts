export type Category = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  created_at?: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  image_url: string | null;
  stock: number;
  created_at?: string;
};

export type Product = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  original_price: number | null;
  image_url: string[];
  images: string[];
  category_id: string | null;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  rating: number;
  reviews_count: number;
  created_at?: string;
  category?: Category; // for joined queries
  variants?: ProductVariant[]; // for joined queries
};

export type ShippingRate = {
  id: string;
  wilaya_name_ar: string;
  wilaya_name_en: string;
  wilaya_id: number;
  home_delivery_price: number;
  desk_delivery_price: number | null;
  return_price: number;
  delivery_time: string | null;
  created_at?: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  wilaya: string;
  commune: string | null;
  address: string;
  total_price: number;
  shipping_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  order_items?: OrderItem[]; // for joined queries
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  quantity: number;
  price: number;
  product?: Product; // for joined queries
  variant?: ProductVariant; // for joined queries
};

export type StoreConfig = {
  id: number;
  store_name: string;
  logo_url: string | null;
  hero_images: string[]; // Changed from hero_image_url to hero_images
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  whatsapp_number: string | null;
  updated_at?: string;
};
