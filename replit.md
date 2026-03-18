# Kace Gaming Admin Panel

لوحة تحكم متجر Kace Gaming - React + Vite + Express

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Framer Motion
- **Backend**: Express.js server (server.ts) - يعمل كـ API + Vite dev server
- **Database**: Turso (libSQL) - متصل مباشرة من السيرفر
- **Images**: Cloudinary
- **Realtime Notifications**: Pusher

## Database (Turso)

- URL: `libsql://casagaming1-casagaming.aws-eu-west-1.turso.io`
- الجداول: categories, products, product_variants, orders, order_items, shipping_rates, store_config, banners
- الاتصال مباشر من السيرفر بدون أي تدخل خارجي

## Notifications (Pusher)

- App ID: 2129205 | Cluster: eu
- Channel: `orders-channel` | Event: `new-order`
- يُطلق الحدث تلقائياً عند إنشاء طلبية جديدة عبر `POST /api/orders`

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

Works on any hosting platform - connection is hardcoded with env var fallback.
