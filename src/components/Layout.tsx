import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import {
  LayoutDashboard,
  ShoppingCart,
  Image as ImageIcon,
  Package,
  Tags,
  Truck,
  Settings,
  BellDot,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, path: "/" },
  { icon: ShoppingCart, path: "/orders" },
  { icon: ImageIcon, path: "/banners" },
  { icon: Package, path: "/products" },
  { icon: Tags, path: "/categories" },
  { icon: Truck, path: "/shipping" },
  { icon: Settings, path: "/settings" },
];

export default function Layout() {
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Initialize Pusher
    const pusher = new Pusher("6f398ffd3b06e741d29f", {
      cluster: "eu",
    });

    const channel = pusher.subscribe("orders-channel");
    channel.bind("new-order", (data: any) => {
      setNotifications((prev) => [data, ...prev]);
      // Play notification sound
      try {
        const audio = new Audio("https://res.cloudinary.com/ddsikz7wq/video/upload/v1773411583/%D9%86%D8%BA%D9%85%D9%87_%D8%B1%D8%B3%D8%A7%D8%A6%D9%84_%D8%A7%D9%8A%D9%81%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%B5%D9%84%D9%8A%D9%87_%D8%A7%D9%84%D8%A7%D9%8A%D9%81%D9%88%D9%86_11%D8%A8%D8%B1%D9%88_2021_320_qa8kbe.mp3");
        audio.volume = 1.0;
        audio.play().catch(() => {});
      } catch (e) {}

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("طلب جديد! 🛒", {
          body: `تم استلام طلب جديد من ${data.customer_name || 'زبون'} - ${data.total_price ? data.total_price + ' د.ج' : ''}`,
          icon: "/favicon.ico",
        });
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex h-20 items-center px-4 sm:px-6 justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-4 flex-shrink-0">
            <h1 className="text-xl font-black text-indigo-600 hidden sm:block">
              Kace Admin
            </h1>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
          </div>
          <div className="flex-1 flex justify-center overflow-x-auto no-scrollbar py-2">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border p-1 border-none shadow-none bg-transparent">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    style={{ gap: "0rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button 
              onClick={requestNotificationPermission}
              className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition-all text-xs font-bold border border-amber-200 animate-pulse hidden md:flex"
            >
              <BellDot className="w-4 h-4" />
              تفعيل الإشعارات
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 text-gray-500 hover:text-indigo-600 transition-all bg-gray-50 rounded-xl hover:bg-indigo-50 border border-gray-100"
              >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">الإشعارات</h3>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-medium">
                      {notifications.length} جديد
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        لا توجد إشعارات جديدة
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif, i) => (
                          <div key={i} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                            <p className="text-sm font-medium text-gray-900">طلب جديد #{notif.id || 'جديد'}</p>
                            <p className="text-xs text-gray-500 mt-1">من: {notif.customer_name || 'زبون'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col min-w-0 max-w-7xl mx-auto w-full">
        <div className="flex-1 p-4 sm:p-8" dir="rtl">
          <Outlet />
        </div>
      </main>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
