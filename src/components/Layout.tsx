import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Tags, Image as ImageIcon, Truck, Settings, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'الرئيسية' },
  { path: '/orders', icon: ShoppingCart, label: 'الطلبات' },
  { path: '/products', icon: Package, label: 'المنتجات' },
  { path: '/categories', icon: Tags, label: 'التصنيفات' },
  { path: '/banners', icon: ImageIcon, label: 'البانرات' },
  { path: '/shipping', icon: Truck, label: 'أسعار الشحن' },
  { path: '/settings', icon: Settings, label: 'الإعدادات' },
];

export default function Layout() {
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Initialize Pusher
    const pusher = new Pusher('6f398ffd3b06e741d29f', {
      cluster: 'eu'
    });

    const channel = pusher.subscribe('orders-channel');
    channel.bind('new-order', (data: any) => {
      toast.success(`طلب جديد من ${data.customer_name} بقيمة ${data.total_price} د.ج`);
      setNotifications(prev => [data, ...prev]);
      
      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed', e));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative" dir="rtl">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex h-20 items-center px-4 sm:px-6 justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1 className="text-xl font-black text-indigo-600 hidden sm:block">Kace Admin</h1>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          </div>
          
          <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl p-1 bg-transparent">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      isActive 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 ml-2" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button className="relative p-2.5 text-gray-500 hover:text-indigo-600 transition-all bg-gray-50 rounded-xl hover:bg-indigo-50 border border-gray-100">
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
