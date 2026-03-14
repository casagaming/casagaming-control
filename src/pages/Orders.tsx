import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Order } from '../types/supabase';
import { format } from 'date-fns';
import { Eye, Search, Printer, CheckCircle2, XCircle, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type OrderTab = 'all' | 'pending' | 'confirmed' | 'cancelled';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<OrderTab>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name_en,
              image_url
            ),
            variant:product_variants (
              id,
              name_en,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Order ${status} successfully`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && order.status === 'pending';
    if (activeTab === 'confirmed') return matchesSearch && ['confirmed', 'shipped', 'delivered'].includes(order.status);
    if (activeTab === 'cancelled') return matchesSearch && order.status === 'cancelled';
    return matchesSearch;
  });

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusIcons = {
    pending: <Clock className="w-3 h-3" />,
    confirmed: <CheckCircle2 className="w-3 h-3" />,
    shipped: <Truck className="w-3 h-3" />,
    delivered: <PackageCheck className="w-3 h-3" />,
    cancelled: <XCircle className="w-3 h-3" />,
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">طلبات المتجر</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة الطلبات وحالات التوصيل</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث عن طلب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'all', label: 'الكل', count: orders.length },
          { id: 'pending', label: 'معلقة', count: orders.filter(o => o.status === 'pending').length },
          { id: 'confirmed', label: 'مؤكدة', count: orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length },
          { id: 'cancelled', label: 'ملغية', count: orders.filter(o => o.status === 'cancelled').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as OrderTab)}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">الزبون</th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">الإجمالي</th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500 font-medium">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle className="w-12 h-12 stroke-1" />
                      <p className="text-lg font-medium">لا توجد طلبات حالياً</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className="text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                        #{order.id.slice(0, 6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[100px] sm:max-w-none">{order.customer_name}</span>
                        <span className="text-xs text-gray-500 font-medium">{order.phone}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {format(new Date(order.created_at), 'yyyy/MM/dd')}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-black text-gray-900">{order.total_price} د.ج</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${statusColors[order.status]}`}>
                        <span className="hidden xs:inline">{statusIcons[order.status]}</span>
                        {order.status === 'pending' ? 'انتظار' : 
                         order.status === 'confirmed' ? 'مؤكد' : 
                         order.status === 'shipped' ? 'شحن' : 
                         order.status === 'delivered' ? 'وصل' : 'ملغي'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 text-gray-700 font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 h-4" />
                        <span className="hidden xs:inline">عرض</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:p-0">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-h-full print:rounded-none">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center print:hidden">
              <h2 className="text-xl font-bold text-gray-900">تفاصيل الطلب #{selectedOrder.id.slice(0, 8).toUpperCase()}</h2>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">تفاصيل الزبون</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedOrder.customer_name}</p>
                  <p className="text-indigo-600 font-bold">{selectedOrder.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">عنوان التوصيل</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.wilaya}</p>
                  <p className="text-gray-500 font-medium">{selectedOrder.commune ? `${selectedOrder.commune} - ` : ''}{selectedOrder.address}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-3 print:hidden">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">تغيير حالة الطلب</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'pending', label: 'انتظار', color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
                    { id: 'confirmed', label: 'تأكيد', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
                    { id: 'shipped', label: 'تم الشحن', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200' },
                    { id: 'delivered', label: 'وصلت', color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' },
                    { id: 'cancelled', label: 'إلغاء', color: 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateOrderStatus(selectedOrder.id, s.id)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedOrder.status === s.id ? 'opacity-40 cursor-not-allowed scale-95' : s.color
                      }`}
                      disabled={selectedOrder.status === s.id}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">المنتجات المطلوبة</p>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl overflow-hidden border border-gray-100 bg-white flex-shrink-0">
                          <img 
                            src={
                              item.variant?.image_url 
                                ? item.variant.image_url 
                                : (Array.isArray(item.product?.image_url) ? item.product.image_url[0] : '')
                            } 
                            alt={item.product?.name_en || 'Product'} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {item.product?.name_en || 'Unknown'}
                            {item.variant && <span className="text-indigo-600 block text-xs">Variant: {item.variant.name_en}</span>}
                          </p>
                          <p className="text-xs font-medium text-gray-500">{item.quantity} x {item.price} د.ج</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-gray-900">{item.price * item.quantity} د.ج</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">سعر المنتجات</span>
                  <span className="font-bold text-gray-900">{selectedOrder.total_price - selectedOrder.shipping_price} د.ج</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">سعر التوصيل</span>
                  <span className="font-bold text-gray-900">{selectedOrder.shipping_price} د.ج</span>
                </div>
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl">
                  <span className="font-bold text-indigo-700">المبلغ الإجمالي</span>
                  <span className="text-xl font-black text-indigo-700">{selectedOrder.total_price} د.ج</span>
                </div>
              </div>
            </div>

            {/* Print Footer Hidden normally */}
            <div className="hidden print:block p-8 border-t border-gray-100">
               <p className="text-center font-bold text-gray-900 text-lg">CASA GAMING</p>
               <p className="text-center text-sm text-gray-500">نشكركم على اختياركم متجرنا</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
