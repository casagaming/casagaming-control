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
import { Dock } from './ui/dock-two';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const NOTIFICATION_SOUND = "https://res.cloudinary.com/ddsikz7wq/video/upload/v1773411583/%D9%86%D8%BA%D9%85%D9%87_%D8%B1%D8%B3%D8%A7%D8%A6%D9%84_%D8%A7%D9%8A%D9%81%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%B5%D9%84%D9%8A%D9%87_%D8%A7%D9%84%D8%A7%D9%8A%D9%81%D9%88%D9%86_11%D8%A8%D8%B1%D9%88_2021_320_qa8kbe.mp3";

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Banners', path: '/banners', icon: Image },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Shipping Rates', path: '/shipping', icon: Truck },
  { name: 'Settings', path: '/settings', icon: Settings },
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
    // Initialize audio
    audioRef.current = new Audio(NOTIFICATION_SOUND);
    audioRef.current.load();

    // Set up real-time listener for new orders
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('New order received!', payload);
          setHasNewOrder(true);
          
          // 1. Browser Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('طلبية جديدة وصلتك!', {
              body: `رقم الطلبية: ${payload.new.id}`,
              icon: '/logo.png', // Assuming a logo exists
            });
          }

          // 2. Toast Notification
          toast.success('طلبية جديدة وصلتك!', {
            icon: '🛍️',
            duration: 5000,
          });
          
          // 3. Audio Notification
          if (audioRef.current) {
            audioRef.current.play().catch(err => {
              console.error('Audio play failed:', err);
              // Fallback: toast might inform user to click to enable sound
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        // iOS requires user interaction to start audio, let's play a silent pulse if possible
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

  const dockItems = navItems.map(item => ({
    icon: item.icon,
    label: item.name,
    onClick: () => {
      if (item.path === '/orders') setHasNewOrder(false);
      navigate(item.path);
    },
    isActive: location.pathname === item.path
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative pb-24 sm:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center px-4 sm:px-6 justify-between max-w-7xl mx-auto w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Kace Admin</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Notification Permission Button */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestPermission}
                className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-amber-100 transition-all text-xs sm:text-sm font-medium border border-amber-200 animate-pulse"
              >
                <BellDot className="w-3.5 h-3.5 sm:w-4 h-4" />
                تفعيل الإشعارات
              </button>
            )}

            <button 
              onClick={() => {
                setHasNewOrder(false);
                navigate('/orders');
              }}
              className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors bg-gray-50 rounded-full"
            >
              {hasNewOrder ? (
                <>
                  <BellDot className="w-5 h-5 sm:w-6 h-6 text-indigo-600 animate-bounce" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
                </>
              ) : (
                <Bell className="w-5 h-5 sm:w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full pb-20 sm:pb-24">
        <div className="flex-1 p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Floating Dock */}
      <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-50 pointer-events-none scale-90 sm:scale-100 origin-bottom">
        <div className="pointer-events-auto px-4">
          <Dock items={dockItems} />
        </div>
      </div>
    </div>
  );
}
