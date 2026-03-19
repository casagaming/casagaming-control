import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Truck, 
  Settings,
  Bell,
  BellDot,
  Image
} from 'lucide-react';
import { ExpandableTabs } from './ui/expandable-tabs';
import Pusher from 'pusher-js';
import toast from 'react-hot-toast';

const NOTIFICATION_SOUND = "https://res.cloudinary.com/ddsikz7wq/video/upload/v1773411583/%D9%86%D8%BA%D9%85%D9%87_%D8%B1%D8%B3%D8%A7%D8%A6%D9%84_%D8%A7%D9%8A%D9%81%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%B5%D9%84%D9%8A%D9%87_%D8%A7%D9%84%D8%A7%D9%8A%D9%81%D9%88%D9%86_11%D8%A8%D8%B1%D9%88_2021_320_qa8kbe.mp3";

const PUSHER_KEY = '6f398ffd3b06e741d29f';
const PUSHER_CLUSTER = 'eu';

const navItems = [
  { name: 'الرئيسية', path: '/', icon: LayoutDashboard },
  { name: 'الطلبيات', path: '/orders', icon: ShoppingCart },
  { name: 'البنرات', path: '/banners', icon: Image },
  { name: 'المنتجات', path: '/products', icon: Package },
  { name: 'التصنيفات', path: '/categories', icon: Tags },
  { name: 'التوصيل', path: '/shipping', icon: Truck },
  { name: 'الإعدادات', path: '/settings', icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.load();

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    const channel = pusher.subscribe('orders-channel');

    channel.bind('new-order', (data: any) => {
      console.log('New order received via Pusher!', data);
      setHasNewOrder(true);

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('طلبية جديدة وصلتك!', {
          body: `الزبون: ${data.customer_name} - ${data.total_price} د.ج`,
          icon: '/logo.png',
        });
      }

      toast.success('طلبية جديدة وصلتك!', { icon: '🛍️', duration: 5000 });

      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Audio play failed:', err);
        });
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('orders-channel');
      pusher.disconnect();
    };
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('تم تفعيل التنبيهات بنجاح');
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('Permission request failed', error);
    }
  };

  const tabs = navItems.map(item => ({ title: item.name, icon: item.icon }));
  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  const handleTabChange = (index: number | null) => {
    if (index !== null) {
      const path = navItems[index].path;
      if (path === '/orders') setHasNewOrder(false);
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex h-20 items-center px-4 sm:px-6 justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1 className="text-xl font-black text-indigo-600 hidden sm:block">Kace Admin</h1>
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />
          </div>
          
          <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar py-2">
            <ExpandableTabs 
              tabs={tabs} 
              activeTab={activeIndex === -1 ? null : activeIndex}
              onChange={handleTabChange}
              activeColor="text-indigo-600"
              className="border-none shadow-none bg-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition-all text-xs font-bold border border-amber-200 animate-pulse hidden md:flex"
              >
                <BellDot className="w-4 h-4" />
                تفعيل الإشعارات
              </button>
            )}

            <button 
              onClick={() => {
                setHasNewOrder(false);
                navigate('/orders');
              }}
              className="relative p-2.5 text-gray-500 hover:text-indigo-600 transition-all bg-gray-50 rounded-xl hover:bg-indigo-50 border border-gray-100"
            >
              {hasNewOrder ? (
                <>
                  <BellDot className="w-6 h-6 text-indigo-600 animate-bounce" />
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                </>
              ) : (
                <Bell className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full">
        <div className="flex-1 p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
