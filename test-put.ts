import axios from 'axios';

async function test() {
  try {
    const res = await axios.put('http://localhost:3000/api/products/511d3f13e4f24c50f9a96ce939ed860d', {
      name_ar: 'test updated',
      name_en: 'test updated',
      description_ar: 'test updated',
      description_en: 'test updated',
      price: 15,
      original_price: 20,
      image_url: [],
      category_id: 1,
      stock: 5,
      is_featured: true,
      is_new: true,
      is_sale: true
    });
    console.log('Success:', res.data);
  } catch (e: any) {
    console.error('Failed:', e.response?.data || e.message);
  }
}
test();
