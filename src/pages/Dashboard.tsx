import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Package, ShoppingCart, DollarSign, Tags, Clock, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [ordersRes, productsRes, categoriesRes, recentOrdersRes] = await Promise.all([
          supabase.from('orders').select('total_price', { count: 'exact' }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        const revenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

        setStats({
          totalOrders: ordersRes.count || 0,
          totalRevenue: revenue,
          totalProducts: productsRes.count || 0,
          totalCategories: categoriesRes.count || 0,
        });
        
        setRecentOrders(recentOrdersRes.data || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  const statCards = [
    { name: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingCart, color: 'bg-blue-600' },
    { name: 'إجمالي الأرباح', value: `${stats.totalRevenue.toLocaleString()} د.ج`, icon: DollarSign, color: 'bg-emerald-600' },
    { name: 'إجمالي المنتجات', value: stats.totalProducts, icon: Package, color: 'bg-purple-600' },
    { name: 'إجمالي الأصناف', value: stats.totalCategories, icon: Tags, color: 'bg-orange-600' },
  ];

  const highlightCards = recentOrders.map((order) => ({
    icon: <Clock className="size-4 text-indigo-300" />,
    title: `طلب #${order.id.slice(0, 8).toUpperCase()}`,
    description: `${order.customer_name} - ${order.total_price} د.ج`,
    date: formatDistanceToNow(new Date(order.created_at), { addSuffix: true }),
    iconClassName: "text-indigo-500",
    titleClassName: "text-indigo-500",
    className: "hover:-translate-y-2 transition-transform duration-300",
    onClick: () => navigate('/orders'),
  }));

  // If there are no recent orders, show a placeholder
  if (highlightCards.length === 0) {
    highlightCards.push({
      icon: <Bell className="size-4 text-gray-300" />,
      title: "لا توجد طلبات حديثة",
      description: "بانتظار وصول طلبات جديدة...",
      date: "الآن",
      iconClassName: "text-gray-500",
      titleClassName: "text-gray-500",
      className: "hover:-translate-y-2 transition-transform duration-300",
      onClick: () => navigate('/orders'),
    });
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="px-1">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة تحكم Kace Gaming</p>
      </div>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={`p-3 rounded-xl text-white shadow-lg shadow-gray-200 ${stat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                  <p className="text-lg sm:text-2xl font-black text-gray-900 truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 sm:mt-12">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">آخر التنبيهات</h2>
          <button 
            onClick={() => navigate('/orders')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-bold"
          >
            عرض الكل &larr;
          </button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {highlightCards.map((card, index) => (
              <div 
                key={index}
                onClick={card.onClick}
                className={`relative flex h-32 sm:h-36 flex-col justify-between rounded-2xl border bg-gray-50 px-4 py-4 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-300 shadow-sm ${card.className}`}
              >
                <div className="flex items-start justify-between">
                  <span className="relative inline-block rounded-lg bg-white shadow-sm p-2 mb-2 border border-gray-100">
                    {card.icon}
                  </span>
                  <p className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{card.date}</p>
                </div>
                <div className="min-w-0">
                   <p className={`text-base sm:text-lg font-bold truncate ${card.titleClassName}`}>{card.title}</p>
                   <p className="truncate text-xs sm:text-sm text-gray-600 font-medium">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
