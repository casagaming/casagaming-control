import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import { useLanguage } from "@/lib/LanguageContext";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Tags,
  Clock,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    pending:    { label: t.status_pending,    color: "bg-amber-100 text-amber-700" },
    processing: { label: t.status_processing, color: "bg-blue-100 text-blue-700" },
    shipped:    { label: t.status_shipped,    color: "bg-purple-100 text-purple-700" },
    delivered:  { label: t.status_delivered,  color: "bg-green-100 text-green-700" },
    cancelled:  { label: t.status_cancelled,  color: "bg-red-100 text-red-700" },
  };

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCategories: 0,
    pendingOrders: 0,
    processingOrders: 0,
    todayOrders: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        const [
          ordersRes, revenueRes, productsRes, categoriesRes,
          recentOrdersRes, pendingRes, processingRes, todayRes, lowStockRes
        ] = await Promise.all([
          db.execute("SELECT COUNT(*) as count FROM orders"),
          db.execute("SELECT SUM(total_price) as total FROM orders WHERE status != 'ملغى'"),
          db.execute("SELECT COUNT(*) as count FROM products"),
          db.execute("SELECT COUNT(*) as count FROM categories"),
          db.execute("SELECT id, customer_name, created_at, status, total_price, wilaya FROM orders ORDER BY created_at DESC LIMIT 6"),
          db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'"),
          db.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'processing'"),
          db.execute({ sql: "SELECT COUNT(*) as count FROM orders WHERE created_at >= ?", args: [todayStr] }),
          db.execute("SELECT COUNT(*) as count FROM products WHERE stock <= 3 AND stock > 0"),
        ]);

        setStats({
          totalOrders: Number(ordersRes.rows[0]?.count || 0),
          totalRevenue: Number(revenueRes.rows[0]?.total || 0),
          totalProducts: Number(productsRes.rows[0]?.count || 0),
          totalCategories: Number(categoriesRes.rows[0]?.count || 0),
          pendingOrders: Number(pendingRes.rows[0]?.count || 0),
          processingOrders: Number(processingRes.rows[0]?.count || 0),
          todayOrders: Number(todayRes.rows[0]?.count || 0),
          lowStockProducts: Number(lowStockRes.rows[0]?.count || 0),
        });

        setRecentOrders(recentOrdersRes.rows as any[]);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const urgentCount = stats.pendingOrders + stats.processingOrders;
  const currency = lang === "fr" ? "DZD" : "د.ج";
  const ArrowIcon = lang === "fr" ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 pb-10" dir={t.dir}>
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t.dashboard_title}</h1>
        <p className="text-slate-400 mt-1 text-sm">{t.dashboard_welcome}</p>
      </div>

      {urgentCount > 0 && (
        <button
          onClick={() => navigate("/orders")}
          className="w-full flex items-center justify-between gap-4 bg-gradient-to-l from-red-500 to-rose-600 text-white rounded-2xl p-4 shadow-lg shadow-red-100 hover:shadow-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className={t.dir === "rtl" ? "text-right" : "text-left"}>
              <p className="font-black text-base">{t.urgent_title(urgentCount)}</p>
              <p className="text-red-100 text-xs mt-0.5">
                {stats.pendingOrders > 0 && t.pending_sub(stats.pendingOrders)}
                {stats.pendingOrders > 0 && stats.processingOrders > 0 && " · "}
                {stats.processingOrders > 0 && t.processing_sub(stats.processingOrders)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold opacity-80 group-hover:opacity-100">
            {t.view_orders}
            <ArrowIcon className="w-4 h-4" />
          </div>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.stat_total_orders}
          value={stats.totalOrders}
          icon={ShoppingCart}
          color="blue"
          sub={stats.todayOrders > 0 ? t.stat_today(stats.todayOrders) : undefined}
          onClick={() => navigate("/orders")}
          loading={loading}
        />
        <StatCard
          label={t.stat_revenue}
          value={`${stats.totalRevenue.toLocaleString()} ${currency}`}
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard
          label={t.stat_products}
          value={stats.totalProducts}
          icon={Package}
          color="purple"
          sub={stats.lowStockProducts > 0 ? t.stat_low_stock(stats.lowStockProducts) : undefined}
          subColor={stats.lowStockProducts > 0 ? "text-amber-600" : undefined}
          onClick={() => navigate("/products")}
          loading={loading}
        />
        <StatCard
          label={t.stat_categories}
          value={stats.totalCategories}
          icon={Tags}
          color="orange"
          onClick={() => navigate("/categories")}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.status_pending,    count: stats.pendingOrders,    icon: Clock,        color: "bg-amber-50 text-amber-700 border-amber-100",    dot: "bg-amber-400" },
          { label: t.status_processing, count: stats.processingOrders, icon: Loader2,      color: "bg-blue-50 text-blue-700 border-blue-100",       dot: "bg-blue-400" },
          { label: t.status_delivered,  count: 0,                       icon: CheckCircle2, color: "bg-green-50 text-green-700 border-green-100",    dot: "bg-green-400" },
          { label: t.status_today,      count: stats.todayOrders,       icon: TrendingUp,   color: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-400" },
        ].map(({ label, count, icon: Icon, color, dot }) => (
          <button
            key={label}
            onClick={() => navigate("/orders")}
            className={`flex items-center gap-3 rounded-2xl border p-3 transition-all hover:shadow-sm ${color}`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <div className={`${t.dir === "rtl" ? "text-right" : "text-left"} min-w-0`}>
              <p className="text-xs opacity-70 truncate">{label}</p>
              <p className="text-xl font-black">{loading ? "—" : count}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t.recent_orders}</h2>
          <button
            onClick={() => navigate("/orders")}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
          >
            {t.view_all}
            <ArrowIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{t.no_recent_orders}</p>
            </div>
          ) : (
            recentOrders.map((order) => {
              const badge = STATUS_BADGE[order.status as string] || { label: order.status, color: "bg-slate-100 text-slate-600" };
              return (
                <div
                  key={order.id as number}
                  onClick={() => navigate("/orders")}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                    {String(order.customer_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{order.customer_name}</p>
                    <p className="text-xs text-slate-400 truncate">{order.wilaya || ""} · #{String(order.id).substring(0, 8)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="font-bold text-sm text-slate-900">{order.total_price} <span className="text-xs font-normal text-slate-400">{currency}</span></span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, color, sub, subColor, onClick, loading
}: {
  label: string;
  value: string | number;
  icon: any;
  color: "blue" | "green" | "purple" | "orange";
  sub?: string;
  subColor?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  const colors = {
    blue:   { bg: "bg-blue-600",    shadow: "shadow-blue-100",    ring: "hover:ring-blue-100" },
    green:  { bg: "bg-emerald-600", shadow: "shadow-emerald-100", ring: "hover:ring-emerald-100" },
    purple: { bg: "bg-violet-600",  shadow: "shadow-violet-100",  ring: "hover:ring-violet-100" },
    orange: { bg: "bg-orange-500",  shadow: "shadow-orange-100",  ring: "hover:ring-orange-100" },
  };
  const c = colors[color];

  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 text-right hover:shadow-md ring-2 ring-transparent transition-all ${onClick ? "cursor-pointer " + c.ring : "cursor-default"} w-full`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl ${c.bg} shadow-md ${c.shadow} shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
          {loading ? <span className="opacity-20">—</span> : value}
        </p>
        {sub && (
          <p className={`text-xs font-bold mt-1 ${subColor || "text-emerald-600"}`}>{sub}</p>
        )}
      </div>
    </button>
  );
}
