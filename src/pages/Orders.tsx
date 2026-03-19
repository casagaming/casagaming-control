import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { X, Package, MapPin, Phone, User, Calendar, CreditCard } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

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
        sql: `
          SELECT oi.*, p.name_ar as product_name, p.image_url, pv.name_ar as variant_name 
          FROM order_items oi 
          LEFT JOIN products p ON oi.product_id = p.id 
          LEFT JOIN product_variants pv ON oi.variant_id = pv.id 
          WHERE oi.order_id = ?
        `,
        args: [order.id]
      });
      setOrderItems(res.rows);
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setOrderItems([]);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      await db.execute({
        sql: "UPDATE orders SET status = ? WHERE id = ?",
        args: [newStatus, orderId]
      });
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("فشل تحديث حالة الطلب");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">تفاصيل الطلب #{selectedOrder.id.substring(0, 8)}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status as string)}`}>
                  {getStatusText(selectedOrder.status as string)}
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Order Status Update */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <span className="font-medium text-gray-700">تحديث حالة الطلب:</span>
                <select 
                  value={selectedOrder.status as string}
                  onChange={(e) => updateOrderStatus(selectedOrder.id as string, e.target.value)}
                  disabled={isUpdatingStatus}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:opacity-50"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد التجهيز</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-500" />
                    معلومات الزبون
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">الاسم:</span> <span className="font-medium">{selectedOrder.customer_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">الهاتف:</span> <span className="font-medium" dir="ltr">{selectedOrder.phone}</span></div>
                  </div>
                </div>
                <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-indigo-500" />
                    عنوان التوصيل
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">الولاية:</span> <span className="font-medium">{selectedOrder.wilaya}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">البلدية:</span> <span className="font-medium">{selectedOrder.commune || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">العنوان:</span> <span className="font-medium">{selectedOrder.address}</span></div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-500" />
                  ملخص الطلب
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">تاريخ الطلب:</span> <span className="font-medium" dir="ltr">{new Date(selectedOrder.created_at as string).toLocaleString('ar-DZ')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">سعر الشحن:</span> <span className="font-medium">{selectedOrder.shipping_price} د.ج</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-100"><span className="text-gray-900 font-bold">الإجمالي:</span> <span className="font-bold text-indigo-600 text-lg">{selectedOrder.total_price} د.ج</span></div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  المنتجات المطلوبة
                </h3>
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3">المنتج</th>
                        <th className="px-4 py-3">النوع</th>
                        <th className="px-4 py-3 text-center">الكمية</th>
                        <th className="px-4 py-3">السعر</th>
                        <th className="px-4 py-3">المجموع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orderItems.map((item) => {
                        let images = [];
                        try {
                          images = JSON.parse(item.image_url as string || "[]");
                        } catch (e) {}
                        return (
                          <tr key={item.id as string}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {images[0] ? (
                                  <img src={images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">صورة</div>
                                )}
                                <span className="font-medium">{item.product_name || 'منتج محذوف'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">{item.variant_name || '-'}</td>
                            <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                            <td className="px-4 py-3">{item.price} د.ج</td>
                            <td className="px-4 py-3 font-medium text-indigo-600">{item.price * item.quantity} د.ج</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 shrink-0 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">رقم الطلب</th>
                <th className="px-6 py-4">الزبون</th>
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">الإجمالي</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    لا توجد طلبات
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id as number} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">#{order.id.substring(0, 8)}</td>
                    <td className="px-6 py-4">{order.customer_name}</td>
                    <td className="px-6 py-4" dir="ltr">{new Date(order.created_at as string).toLocaleDateString('ar-DZ')}</td>
                    <td className="px-6 py-4 font-medium text-indigo-600">{order.total_price} د.ج</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status as string)}`}>
                        {getStatusText(order.status as string)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => openOrderDetails(order)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
