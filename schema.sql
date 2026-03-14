-- Clean up existing tables
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS shipping_rates CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS store_config CASCADE;
DROP TABLE IF EXISTS banners CASCADE;

-- 1. categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    image_url TEXT[] NOT NULL DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT true,
    is_sale BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. product_variants
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. shipping_rates
CREATE TABLE shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wilaya_name_ar TEXT NOT NULL,
    wilaya_name_en TEXT NOT NULL,
    wilaya_id INTEGER NOT NULL,
    home_delivery_price NUMERIC NOT NULL,
    desk_delivery_price NUMERIC,
    return_price NUMERIC NOT NULL,
    delivery_time TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    commune TEXT,
    address TEXT NOT NULL,
    total_price NUMERIC NOT NULL,
    shipping_price NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. order_items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL
);

-- 7. store_config
CREATE TABLE store_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT NOT NULL,
    logo_url TEXT,
    hero_images TEXT[] DEFAULT '{}',
    contact_phone TEXT,
    contact_email TEXT,
    contact_address TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    whatsapp_number TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT store_config_single_row CHECK (id = 1)
);

-- 8. banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Initial Shipping Rates Data
INSERT INTO shipping_rates (wilaya_id, wilaya_name_ar, wilaya_name_en, home_delivery_price, desk_delivery_price, return_price, delivery_time) VALUES
(1, 'أدرار', 'Adrar', 1400, 750, 50, 'J+5'),
(2, 'الشلف', 'Chlef', 850, 450, 50, 'J+1'),
(3, 'الأغواط', 'Laghouat', 950, 450, 50, 'J+1'),
(4, 'أم البواقي', 'Oum El Bouaghi', 900, 450, 50, 'J+1'),
(5, 'باتنة', 'Batna', 850, 450, 50, 'J+1'),
(6, 'بجاية', 'Béjaïa', 850, 450, 50, 'J+1'),
(7, 'بسكرة', 'Biskra', 950, 450, 50, 'J+1'),
(8, 'بشار', 'Béchar', 1200, 450, 50, 'J+3'),
(9, 'البليدة', 'Blida', 700, 450, 50, 'J+1'),
(10, 'البويرة', 'Bouira', 700, 450, 50, 'J+1'),
(11, 'تمنراست', 'Tamanrasset', 1600, 900, 50, 'J+5'),
(12, 'تبسة', 'Tébessa', 900, 450, 50, 'J+1'),
(13, 'تلمسان', 'Tlemcen', 850, 450, 50, 'J+1'),
(14, 'تيارت', 'Tiaret', 850, 450, 50, 'J+1'),
(15, 'تيزي وزو', 'Tizi Ouzou', 700, 450, 50, 'J+1'),
(16, 'الجزائر', 'Alger', 500, 400, 50, 'J+1'),
(17, 'الجلفة', 'Djelfa', 950, 450, 50, 'J+1'),
(18, 'جيجل', 'Jijel', 850, 450, 50, 'J+1'),
(19, 'سطيف', 'Sétif', 850, 450, 50, 'J+1'),
(20, 'سعيدة', 'Saïda', 900, 450, 50, 'J+1'),
(21, 'سكيكدة', 'Skikda', 900, 450, 50, 'J+1'),
(22, 'سيدي بلعباس', 'Sidi Bel Abbès', 850, 450, 50, 'J+1'),
(23, 'عنابة', 'Annaba', 850, 450, 50, 'J+1'),
(24, 'قالمة', 'Guelma', 900, 450, 50, 'J+1'),
(25, 'قسنطينة', 'Constantine', 850, 450, 50, 'J+1'),
(26, 'المدية', 'Médéa', 800, 450, 50, 'J+1'),
(27, 'مستغانم', 'Mostaganem', 850, 450, 50, 'J+1'),
(28, 'المسيلة', 'M''sila', 850, 450, 50, 'J+1'),
(29, 'معسكر', 'Mascara', 850, 450, 50, 'J+1'),
(30, 'ورقلة', 'Ouargla', 1000, 450, 50, 'J+2'),
(31, 'وهران', 'Oran', 850, 450, 50, 'J+1'),
(32, 'البيض', 'El Bayadh', 1100, 450, 50, 'J+2'),
(33, 'إليزي', 'Illizi', 1600, 1000, 50, 'J+9'),
(34, 'برج بوعريريج', 'Bordj Bou Arreridj', 850, 450, 50, 'J+1'),
(35, 'بومرداس', 'Boumerdès', 500, 350, 50, 'J+1'),
(36, 'الطارف', 'El Tarf', 900, 450, 50, 'J+1'),
(37, 'تندوف', 'Tindouf', 1500, NULL, 50, 'J+5'),
(38, 'تيسمسيلت', 'Tissemsilt', 850, 450, 50, 'J+1'),
(39, 'الوادي', 'El Oued', 1000, 450, 50, 'J+2'),
(40, 'خنشلة', 'Khenchela', 900, 450, 50, 'J+1'),
(41, 'سوق أهراس', 'Souk Ahras', 900, 450, 50, 'J+1'),
(42, 'تيبازة', 'Tipaza', 700, 450, 50, 'J+1'),
(43, 'ميلة', 'Mila', 850, 450, 50, 'J+1'),
(44, 'عين الدفلة', 'Aïn Defla', 850, 450, 50, 'J+1'),
(45, 'النعامة', 'Naâma', 1100, 450, 50, 'J+2'),
(46, 'عين تموشنت', 'Aïn Témouchent', 850, 450, 50, 'J+1'),
(47, 'غرداية', 'Ghardaïa', 1000, 450, 50, 'J+2'),
(48, 'غليزان', 'Relizane', 850, 450, 50, 'J+1'),
(49, 'تيميمون', 'Timimoun', 1500, NULL, 50, 'J+5'),
(50, 'برج باجي مختار', 'Bordj Badji Mokhtar', 1600, NULL, 50, 'J+4'),
(51, 'أولاد جلال', 'Ouled Djellal', 1000, 450, 50, 'J+1'),
(52, 'بني عباس', 'Beni Abbes', 1200, NULL, 50, 'J+3'),
(53, 'عين صالح', 'In Salah', 1600, 800, 50, 'J+5'),
(54, 'عين قزام', 'In Guezzam', 1500, NULL, 50, 'J+5'),
(55, 'تقرت', 'Touggourt', 1000, 450, 50, 'J+2'),
(56, 'جانت', 'Djanet', 1650, 1100, 50, 'J+9'),
(57, 'المغير', 'El M''Ghair', 1000, 550, 50, 'J+3'),
(58, 'المنيعة', 'El Meniaa', 1000, NULL, 50, 'J+3');
