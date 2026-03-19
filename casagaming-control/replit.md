# Kace Gaming Admin Panel

لوحة تحكم متجر Kace Gaming - React + Vite + Express

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Framer Motion
- **Backend**: Express.js server (server.ts) - يعمل كـ API + Vite dev server
- **Database**: Turso (libSQL) - متصل مباشرة من السيرفر عبر متغيرات البيئة
- **Images**: Cloudinary - متصل عبر متغيرات البيئة
- **Realtime Notifications**: Pusher - متصل عبر متغيرات البيئة

## Environment Variables (Secrets)

جميع المعلومات الحساسة محفوظة كـ secrets في Replit:

- `TURSO_DATABASE_URL` - رابط قاعدة البيانات
- `TURSO_AUTH_TOKEN` - مفتاح المصادقة لـ Turso
- `CLOUDINARY_CLOUD_NAME` - اسم السحابة في Cloudinary
- `CLOUDINARY_API_KEY` - مفتاح API لـ Cloudinary
- `CLOUDINARY_API_SECRET` - الرمز السري لـ Cloudinary
- `PUSHER_APP_ID` - معرف تطبيق Pusher
- `PUSHER_KEY` - مفتاح Pusher
- `PUSHER_SECRET` - الرمز السري لـ Pusher
- `PUSHER_CLUSTER` - مجموعة Pusher (eu)

## Database (Turso)

- URL: `libsql://casagaming1-casagaming.aws-eu-west-1.turso.io`
- الجداول: categories, products, product_variants, orders, order_items, shipping_rates, store_config, banners

## Notifications (Pusher)

- Cluster: eu
- Channel: `orders-channel` | Event: `new-order`
- يُطلق الحدث تلقائياً عند إنشاء طلبية جديدة عبر `POST /api/orders`
- صوت الإشعار: Cloudinary MP3

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | /api/categories | قائمة/إنشاء صنف |
| PUT/DELETE | /api/categories/:id | تعديل/حذف صنف |
| GET/POST | /api/products | قائمة/إنشاء منتج |
| PUT/DELETE | /api/products/:id | تعديل/حذف منتج |
| GET/POST | /api/orders | قائمة/إنشاء طلبية |
| PATCH | /api/orders/:id/status | تحديث حالة طلبية |
| GET | /api/shipping-rates | أسعار التوصيل |
| PUT | /api/shipping-rates/:id | تعديل سعر |
| GET/PUT | /api/store-config | إعدادات المتجر |
| GET/POST | /api/banners | البنرات |
| PUT/DELETE | /api/banners/:id | تعديل/حذف بنر |
| GET | /api/stats | إحصائيات لوحة التحكم |
| POST | /api/upload | رفع صورة Cloudinary |
| POST | /api/delete-image | حذف صورة Cloudinary |

## Running

```bash
npm run dev  # runs on port 5000
```

## Production

المشروع جاهز للنشر على أي استضافة. جميع الإعدادات الحساسة محفوظة كمتغيرات بيئة.
