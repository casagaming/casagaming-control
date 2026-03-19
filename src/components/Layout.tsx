import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Image as ImageIcon,
  Package,
  Tags,
  Truck,
  Settings,
  BellRing,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

declare global {
  interface Window {
    OneSignalDeferred?: ((os: any) => void)[];
    OneSignal?: any;
  }
}
import { cn } from "@/lib/utils";
import { useNewOrders, usePusherOrders } from "@/lib/useNewOrders";

const navItems = [
  { icon: LayoutDashboard, path: "/",          label: "الرئيسية" },
  { icon: ShoppingCart,    path: "/orders",     label: "الطلبات", isOrders: true },
  { icon: Package,         path: "/products",   label: "المنتجات" },
  { icon: Tags,            path: "/categories", label: "الأصناف" },
  { icon: ImageIcon,       path: "/banners",    label: "البنرات" },
  { icon: Truck,           path: "/shipping",   label: "الشحن" },
  { icon: Settings,        path: "/settings",   label: "الإعدادات" },
];

interface Toast {
  id: number;
  customer: string;
  orderId: string | number;
  total: number;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { newCount, markAsSeen } = useNewOrders();
  const [localNewCount, setLocalNewCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const toastCounter = useRef(0);

  useEffect(() => {
    setLocalNewCount(newCount);
  }, [newCount]);

  useEffect(() => {
    if (location.pathname === "/orders") {
      markAsSeen();
      setLocalNewCount(0);
    }
  }, [location.pathname, markAsSeen]);

  const handleNewOrder = useCallback((data: any) => {
    setNotifications(prev => [data, ...prev]);
    setLocalNewCount(prev => prev + 1);

    const id = ++toastCounter.current;
    setToasts(prev => [...prev, {
      id,
      customer: data.customer_name || 'زبون',
      orderId: data.id || '—',
      total: data.total_price || 0,
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);

    try {
      const audio = new Audio("https://res.cloudinary.com/ddsikz7wq/video/upload/v1773411583/%D9%86%D8%BA%D9%85%D9%87_%D8%B1%D8%B3%D8%A7%D8%A6%D9%84_%D8%A7%D9%8A%D9%81%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%B5%D9%84%D9%8A%D9%87_%D8%A7%D9%84%D8%A7%D9%8A%D9%81%D9%88%D9%86_11%D8%A8%D8%B1%D9%88_2021_320_qa8kbe.mp3");
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  usePusherOrders(handleNewOrder);

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const check = () => {
      if (window.OneSignal) {
        window.OneSignal.User?.PushSubscription?.optedIn
          ? setIsSubscribed(true)
          : setIsSubscribed(false);
      }
    };
    const timer = setTimeout(check, 2000);
    return () => clearTimeout(timer);
  }, []);

  const requestPushSubscription = () => {
    if (window.OneSignal) {
      window.OneSignal.Slidedown?.promptPush?.().catch(() => {});
    } else if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.Slidedown.promptPush();
          setIsSubscribed(true);
        } catch {}
      });
    }
  };

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 right-0 h-full z-50 flex flex-col bg-white border-l border-slate-100 shadow-xl transition-all duration-300",
        sidebarExpanded ? "w-56" : "w-16",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn(
          "flex items-center h-16 border-b border-slate-100 shrink-0 px-4",
          sidebarExpanded ? "justify-between" : "justify-center"
        )}>
          {sidebarExpanded && (
            <span className="text-lg font-black text-indigo-600 tracking-tight">Kace Admin</span>
          )}
          <button
            onClick={() => setSidebarExpanded(p => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors hidden lg:flex"
          >
            {sidebarExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(({ icon: Icon, path, label, isOrders }) => {
            const isActive = location.pathname === path;
            const showBadge = isOrders && localNewCount > 0;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setSidebarOpen(false)}
                title={!sidebarExpanded ? label : undefined}
                className={cn(
                  "relative flex items-center rounded-xl transition-all duration-200 group",
                  sidebarExpanded ? "gap-3 px-3 py-2.5" : "justify-center px-0 py-2.5",
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <div className="relative shrink-0">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className={cn(
                      "absolute -top-2 -left-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white bg-red-500 border-2 border-white px-1 animate-bounce"
                    )}>
                      {localNewCount > 99 ? '99+' : localNewCount}
                    </span>
                  )}
                </div>
                {sidebarExpanded && (
                  <span className="text-sm font-medium">{label}</span>
                )}
                {sidebarExpanded && showBadge && (
                  <span className="mr-auto text-xs font-black bg-red-500 text-white rounded-full px-2 py-0.5 min-w-[22px] text-center">
                    {localNewCount > 99 ? '99+' : localNewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-slate-100 p-3 shrink-0">
          {!isSubscribed ? (
            <button
              onClick={requestPushSubscription}
              title={!sidebarExpanded ? "تفعيل الإشعارات" : undefined}
              className={cn(
                "w-full flex items-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-bold shadow-sm shadow-indigo-200",
                sidebarExpanded ? "gap-2 px-3 py-2.5" : "justify-center py-2.5"
              )}
            >
              <BellRing className="w-4 h-4 shrink-0" />
              {sidebarExpanded && "تفعيل الإشعارات"}
            </button>
          ) : (
            <div
              title={!sidebarExpanded ? "الإشعارات مفعّلة ✓" : undefined}
              className={cn(
                "w-full flex items-center rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-bold",
                sidebarExpanded ? "gap-2 px-3 py-2.5" : "justify-center py-2.5"
              )}
            >
              <BellRing className="w-4 h-4 shrink-0" />
              {sidebarExpanded && "الإشعارات مفعّلة ✓"}
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarExpanded ? "lg:mr-56" : "lg:mr-16"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm h-16 flex items-center px-4 sm:px-6 gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400">
                {navItems.find(n => n.path === location.pathname)?.label || 'لوحة التحكم'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {localNewCount > 0 && (
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-all animate-pulse"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {localNewCount} طلب جديد
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-indigo-600 transition-all bg-slate-50 rounded-xl hover:bg-indigo-50 border border-slate-100"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">الإشعارات</h3>
                    <div className="flex items-center gap-2">
                      {notifications.length > 0 && (
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold">
                          {notifications.length} جديد
                        </span>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        لا توجد إشعارات جديدة
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {notifications.map((notif, i) => (
                          <div
                            key={i}
                            onClick={() => { navigate('/orders'); setShowNotifications(false); }}
                            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">طلب جديد #{notif.id || '—'}</p>
                              <p className="text-xs text-slate-500 mt-0.5">من: {notif.customer_name || 'زبون'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3" dir="rtl">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-72 animate-slide-in"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">🛒 طلب جديد!</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">من: {toast.customer}</p>
              {toast.total > 0 && (
                <p className="text-xs font-bold text-indigo-600 mt-1">{toast.total} د.ج</p>
              )}
              <button
                onClick={() => { navigate('/orders'); dismissToast(toast.id); }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                عرض الطلب <ChevronLeft className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
