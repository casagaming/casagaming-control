import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { ShoppingCart, DollarSign, Package, Tags, Bell } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, revenueRes, productsRes, categoriesRes, recentOrdersRes] = await Promise.all([
          db.execute("SELECT COUNT(*) as count FROM orders"),
          db.execute("SELECT SUM(total_price) as total FROM orders WHERE status != 'ملغى'"),
          db.execute("SELECT COUNT(*) as count FROM products"),
          db.execute("SELECT COUNT(*) as count FROM categories"),
          db.execute("SELECT id, customer_name, created_at, status FROM orders ORDER BY created_at DESC LIMIT 3"),
        ]);

        setStats({
          totalOrders: Number(ordersRes.rows[0]?.count || 0),
          totalRevenue: Number(revenueRes.rows[0]?.total || 0),
          totalProducts: Number(productsRes.rows[0]?.count || 0),
          totalCategories: Number(categoriesRes.rows[0]?.count || 0),
        });

        setRecentOrders(recentOrdersRes.rows as any[]);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة تحكم Kace Gaming</p>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl text-white shadow-lg shadow-gray-200 bg-blue-600">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                إجمالي الطلبات
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl text-white shadow-lg shadow-gray-200 bg-emerald-600">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                إجمالي الأرباح
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
                {stats.totalRevenue} د.ج
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl text-white shadow-lg shadow-gray-200 bg-purple-600">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                إجمالي المنتجات
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
                {stats.totalProducts}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl text-white shadow-lg shadow-gray-200 bg-orange-600">
              <Tags className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                إجمالي الأصناف
              </p>
              <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">
                {stats.totalCategories}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">آخر التنبيهات</h2>
          <button className="text-sm text-indigo-600 hover:text-indigo-800 font-bold">
            عرض الكل ←
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="relative flex h-32 sm:h-36 flex-col justify-between rounded-2xl border bg-gray-50 px-4 py-4 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 shadow-sm hover:-translate-y-2">
                  <div className="flex items-start justify-between">
                    <span className="relative inline-block rounded-lg bg-white shadow-sm p-2 mb-2 border border-gray-100">
                      <Bell className="size-4 text-indigo-500" />
                    </span>
                    <p className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                      {new Date(order.created_at).toLocaleDateString('ar-DZ')}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-bold truncate text-gray-800">
                      طلب جديد #{order.id}
                    </p>
                    <p className="truncate text-xs sm:text-sm text-gray-500 font-medium">
                      من: {order.customer_name} - {order.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="relative flex h-32 sm:h-36 flex-col justify-between rounded-2xl border bg-gray-50 px-4 py-4 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 shadow-sm hover:-translate-y-2">
                <div className="flex items-start justify-between">
                  <span className="relative inline-block rounded-lg bg-white shadow-sm p-2 mb-2 border border-gray-100">
                    <Bell className="size-4 text-gray-300" />
                  </span>
                  <p className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                    الآن
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold truncate text-gray-500">
                    لا توجد طلبات حديثة
                  </p>
                  <p className="truncate text-xs sm:text-sm text-gray-600 font-medium">
                    بانتظار وصول طلبات جديدة...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
