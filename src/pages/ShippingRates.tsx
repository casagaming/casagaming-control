import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShippingRate } from '../types/supabase';
import { Edit, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);

  const [formData, setFormData] = useState({
    home_delivery_price: '',
    desk_delivery_price: '',
    return_price: '',
  });

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('wilaya_id', { ascending: true });

      if (error) throw error;
      setRates(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openModal(rate: ShippingRate) {
    setEditingRate(rate);
    setFormData({
      home_delivery_price: rate.home_delivery_price?.toString() || '',
      desk_delivery_price: rate.desk_delivery_price?.toString() || '',
      return_price: rate.return_price?.toString() || '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRate) return;

    if (!formData.home_delivery_price) {
      toast.error('Home Price is required');
      return;
    }

    try {
      const rateData = {
        home_delivery_price: formData.home_delivery_price ? Number(formData.home_delivery_price) : null,
        desk_delivery_price: formData.desk_delivery_price ? Number(formData.desk_delivery_price) : null,
        return_price: formData.return_price ? Number(formData.return_price) : null,
      };

      const { error } = await supabase
        .from('shipping_rates')
        .update(rateData)
        .eq('id', editingRate.id);

      if (error) throw error;
      toast.success('Shipping rate updated successfully');
      
      setIsModalOpen(false);
      fetchRates();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const filteredRates = rates.filter((rate) =>
    rate.wilaya_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.wilaya_id?.toString().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Rates</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search wilaya..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilaya</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Home Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desk Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Price</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredRates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No rates found</td>
              </tr>
            ) : (
              filteredRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {rate.wilaya_id} - {rate.wilaya_name_en}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.home_delivery_price !== null ? `${rate.home_delivery_price} DA` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rate.desk_delivery_price !== null ? `${rate.desk_delivery_price} DA` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rate.return_price !== null ? `${rate.return_price} DA` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(rate)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Edit Rate: {editingRate.wilaya_name_en}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Home Price (DA)</label>
                <input
                  type="number"
                  value={formData.home_delivery_price}
                  onChange={(e) => setFormData({ ...formData, home_delivery_price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Desk Price (DA)</label>
                <input
                  type="number"
                  value={formData.desk_delivery_price}
                  onChange={(e) => setFormData({ ...formData, desk_delivery_price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Return Price (DA)</label>
                <input
                  type="number"
                  value={formData.return_price}
                  onChange={(e) => setFormData({ ...formData, return_price: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
