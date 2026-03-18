import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Eye, Printer } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الكل');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await axios.patch(`/api/orders/${id}/status`, { status: newStatus });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const viewOrder = async (id: number) => {
    try {
      const res = await axios.get(`/api/orders/${id}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Failed to fetch order details', error);
    }
  };

  const filteredOrders = filter === 'الكل' ? orders : orders.filter((o: any) => o.status === filter);

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
        <div className="flex gap-2">
          {['الكل', 'قيد الانتظار', 'مؤكد', 'تم الشحن', 'تم التسليم', 'ملغى'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">رقم الطلب</th>
                <th className="p-4 font-medium text-gray-500">الزبون</th>
                <th className="p-4 font-medium text-gray-500">المبلغ الإجمالي</th>
                <th className="p-4 font-medium text-gray-500">الحالة</th>
                <th className="p-4 font-medium text-gray-500">التاريخ</th>
                <th className="p-4 font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order: any) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">#{order.id}</td>
                  <td className="p-4 font-medium">{order.customer_name}</td>
                  <td className="p-4 font-bold text-indigo-600">{order.total_price + order.shipping_price} د.ج</td>
                  <td className="p-4">
                    <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-0 cursor-pointer ${
                        order.status === 'قيد الانتظار' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'مؤكد' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'تم الشحن' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'تم التسليم' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      <option value="قيد الانتظار">قيد الانتظار</option>
                      <option value="مؤكد">مؤكد</option>
                      <option value="تم الشحن">تم الشحن</option>
                      <option value="تم التسليم">تم التسليم</option>
                      <option value="ملغى">ملغى</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {format(new Date(order.created_at), 'dd MMMM yyyy', { locale: ar })}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => viewOrder(order.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.id}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">معلومات الزبون</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">الاسم:</span> {selectedOrder.customer_name}</p>
                  <p><span className="font-medium">الهاتف:</span> {selectedOrder.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">عنوان التوصيل</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">الولاية:</span> {selectedOrder.wilaya}</p>
                  <p><span className="font-medium">البلدية:</span> {selectedOrder.commune}</p>
                  <p><span className="font-medium">العنوان:</span> {selectedOrder.address}</p>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-gray-900 mb-4">المنتجات المطلوبة</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-right text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 font-medium text-gray-500">المنتج</th>
                    <th className="p-3 font-medium text-gray-500">الكمية</th>
                    <th className="p-3 font-medium text-gray-500">السعر</th>
                    <th className="p-3 font-medium text-gray-500">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="p-3">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        {item.variant_name && <p className="text-xs text-gray-500">{item.variant_name}</p>}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.price} د.ج</td>
                      <td className="p-3 font-bold">{item.price * item.quantity} د.ج</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي:</span>
                  <span>{selectedOrder.total_price} د.ج</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>سعر الشحن:</span>
                  <span>{selectedOrder.shipping_price} د.ج</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                  <span>الإجمالي:</span>
                  <span>{selectedOrder.total_price + selectedOrder.shipping_price} د.ج</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
