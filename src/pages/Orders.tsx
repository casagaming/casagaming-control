import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { X, Package, MapPin, User, CreditCard, Clock, CheckCircle2, Truck, XCircle, Loader2, ChevronLeft } from "lucide-react";

const STATUSES = [
  { key: "all",        label: "الكل",          color: "indigo",  icon: Package },
  { key: "pending",    label: "قيد الانتظار",   color: "amber",   icon: Clock },
  { key: "processing", label: "قيد التجهيز",    color: "blue",    icon: Loader2 },
  { key: "shipped",    label: "تم الشحن",        color: "purple",  icon: Truck },
  { key: "delivered",  label: "تم التوصيل",      color: "green",   icon: CheckCircle2 },
  { key: "cancelled",  label: "ملغى",            color: "red",     icon: XCircle },
];

const STATUS_STYLES: Record<string, { tab: string; badge: string; card: string; dot: string }> = {
  pending:    { tab: "border-amber-400 text-amber-700 bg-amber-50",   badge: "bg-amber-50 text-amber-700 border-amber-200",   card: "border-amber-100 hover:border-amber-300",   dot: "bg-amber-400" },
  processing: { tab: "border-blue-400 text-blue-700 bg-blue-50",     badge: "bg-blue-50 text-blue-700 border-blue-200",       card: "border-blue-100 hover:border-blue-300",     dot: "bg-blue-400" },
  shipped:    { tab: "border-purple-400 text-purple-700 bg-purple-50",badge: "bg-purple-50 text-purple-700 border-purple-200", card: "border-purple-100 hover:border-purple-300", dot: "bg-purple-400" },
  delivered:  { tab: "border-green-400 text-green-700 bg-green-50",  badge: "bg-green-50 text-green-700 border-green-200",    card: "border-green-100 hover:border-green-300",   dot: "bg-green-400" },
  cancelled:  { tab: "border-red-400 text-red-700 bg-red-50",        badge: "bg-red-50 text-red-700 border-red-200",          card: "border-red-100 hover:border-red-300",       dot: "bg-red-400" },
};

const STATUS_TEXT: Record<string, string> = {
  pending: "قيد الانتظار", processing: "قيد التجهيز",
  shipped: "تم الشحن", delivered: "تم التوصيل", cancelled: "ملغى",
};

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const res = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
      setOrders(res.rows);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }

  const openOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
    try {
      const res = await db.execute({
        sql: `SELECT oi.*, p.name_ar as product_name, p.image_url, pv.name_ar as variant_name
              FROM order_items oi
              LEFT JOIN products p ON oi.product_id = p.id
              LEFT JOIN product_variants pv ON oi.variant_id = pv.id
              WHERE oi.order_id = ?`,
        args: [order.id],
      });
      setOrderItems(res.rows);
    } catch {
      setOrderItems([]);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const oldStatus = selectedOrder?.status as string;
    try {
      setIsUpdatingStatus(true);
      if (newStatus === "cancelled" && oldStatus !== "cancelled") {
        for (const item of orderItems) {
          if (item.variant_id) await db.execute({ sql: "UPDATE product_variants SET stock = stock + ? WHERE id = ?", args: [item.quantity, item.variant_id] });
          await db.execute({ sql: "UPDATE products SET stock = stock + ? WHERE id = ?", args: [item.quantity, item.product_id] });
        }
      }
      if (oldStatus === "cancelled" && newStatus !== "cancelled") {
        for (const item of orderItems) {
          if (item.variant_id) await db.execute({ sql: "UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?", args: [item.quantity, item.variant_id] });
          await db.execute({ sql: "UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?", args: [item.quantity, item.product_id] });
        }
      }
      await db.execute({ sql: "UPDATE orders SET status = ? WHERE id = ?", args: [newStatus, orderId] });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch {
      alert("فشل تحديث حالة الطلب");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = activeTab === "all" ? orders : orders.filter(o => o.status === activeTab);

  const countFor = (key: string) => key === "all" ? orders.length : orders.filter(o => o.status === key).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} طلب إجمالي</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUSES.map(({ key, label, icon: Icon }) => {
          const count = countFor(key);
          const isActive = activeTab === key;
          const style = key !== "all" ? STATUS_STYLES[key] : null;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? key === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                    : `${style!.tab} border-current shadow-sm`
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  isActive
                    ? key === "all" ? "bg-white/20 text-white" : "bg-white/60"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">لا توجد طلبات في هذه الحالة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(order => {
            const style = STATUS_STYLES[order.status as string] || STATUS_STYLES.pending;
            const date = new Date(order.created_at as string);
            const timeAgo = (() => {
              const diff = Date.now() - date.getTime();
              const mins = Math.floor(diff / 60000);
              const hrs = Math.floor(diff / 3600000);
              const days = Math.floor(diff / 86400000);
              if (days > 0) return `منذ ${days} يوم`;
              if (hrs > 0) return `منذ ${hrs} ساعة`;
              return `منذ ${mins} دقيقة`;
            })();

            return (
              <div
                key={order.id as number}
                onClick={() => openOrderDetails(order)}
                className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${style.card}`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <span className="text-xs font-mono text-gray-400">#{String(order.id).substring(0, 8)}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${style.badge}`}>
                    {STATUS_TEXT[order.status as string] || order.status}
                  </span>
                </div>

                {/* Customer */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0">
                    {String(order.customer_name || "؟").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{order.customer_name}</p>
                    <p className="text-xs text-gray-400" dir="ltr">{order.phone}</p>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {order.wilaya || '-'}
                  </span>
                  <span className="text-gray-200">|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-base font-bold text-gray-900">{order.total_price} <span className="text-xs font-normal text-gray-400">د.ج</span></span>
                  <span className="flex items-center gap-1 text-indigo-500 text-xs font-medium">
                    عرض التفاصيل
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLES[selectedOrder.status as string]?.dot || "bg-gray-400"}`} />
                <h2 className="text-lg font-bold text-gray-900">
                  طلب #{String(selectedOrder.id).substring(0, 8)}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[selectedOrder.status as string]?.badge || ""}`}>
                  {STATUS_TEXT[selectedOrder.status as string] || selectedOrder.status}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Status Changer */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                <span className="text-sm font-semibold text-gray-700">تغيير الحالة</span>
                <select
                  value={selectedOrder.status as string}
                  onChange={e => updateOrderStatus(selectedOrder.id as string, e.target.value)}
                  disabled={isUpdatingStatus}
                  className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm disabled:opacity-50 font-medium"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد التجهيز</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>

              {/* Customer + Address */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" /> معلومات الزبون
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">الاسم</span>
                      <span className="font-medium text-gray-900 text-left truncate">{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">الهاتف</span>
                      <span className="font-medium" dir="ltr">{selectedOrder.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" /> العنوان
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">الولاية</span>
                      <span className="font-medium">{selectedOrder.wilaya}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">البلدية</span>
                      <span className="font-medium">{selectedOrder.commune || '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-400 shrink-0">العنوان</span>
                      <span className="font-medium text-left truncate">{selectedOrder.address || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" /> ملخص الطلب
                </h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">تاريخ الطلب</span>
                    <span className="font-medium" dir="ltr">{new Date(selectedOrder.created_at as string).toLocaleString('ar-DZ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">سعر الشحن</span>
                    <span className="font-medium">{selectedOrder.shipping_price} د.ج</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-50">
                    <span className="font-bold text-gray-900">الإجمالي</span>
                    <span className="font-bold text-indigo-600 text-base">{selectedOrder.total_price} د.ج</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              {orderItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" /> المنتجات
                  </h3>
                  <div className="space-y-2">
                    {orderItems.map((item) => {
                      let img = "";
                      try { const arr = JSON.parse(item.image_url || "[]"); img = arr[0] || ""; } catch {}
                      return (
                        <div key={item.id as string} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                          {img ? (
                            <img src={img} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.product_name || 'منتج محذوف'}</p>
                            {item.variant_name && <p className="text-xs text-gray-400">{item.variant_name}</p>}
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-sm font-bold text-gray-900">{(item.price as number) * (item.quantity as number)} د.ج</p>
                            <p className="text-xs text-gray-400">× {item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 shrink-0 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors text-sm">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}
