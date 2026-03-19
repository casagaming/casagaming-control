import { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, Package, Tags, Bell } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-8 pb-12" dir="rtl">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة تحكم Kace Gaming</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="إجمالي الطلبات" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="إجمالي الأرباح" 
          value={`${stats.totalRevenue.toLocaleString()} د.ج`} 
          icon={DollarSign} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="إجمالي المنتجات" 
          value={stats.totalProducts} 
          icon={Package} 
          color="bg-purple-600" 
        />
        <StatCard 
          title="إجمالي التصنيفات" 
          value={stats.totalCategories} 
          icon={Tags} 
          color="bg-orange-600" 
        />
      </div>

      <div className="mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">آخر الطلبات</h2>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">لا توجد طلبات حديثة</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-4 font-medium">رقم الطلب</th>
                    <th className="pb-4 font-medium">الزبون</th>
                    <th className="pb-4 font-medium">المبلغ</th>
                    <th className="pb-4 font-medium">الحالة</th>
                    <th className="pb-4 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4">#{order.id}</td>
                      <td className="py-4 font-medium">{order.customer_name}</td>
                      <td className="py-4 font-bold text-indigo-600">{order.total_price + order.shipping_price} د.ج</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'قيد الانتظار' ? 'bg-amber-100 text-amber-700' :
                          order.status === 'مؤكد' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'تم الشحن' ? 'bg-purple-100 text-purple-700' :
                          order.status === 'تم التسليم' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: ar })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`p-3 rounded-xl text-white shadow-lg shadow-gray-200 ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}
