import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/products', {
      name_ar: 'test',
      name_en: 'test',
      description_ar: 'test',
      description_en: 'test',
      price: 10,
      original_price: 12,
      image_url: [],
      category_id: 1,
      stock: 10,
      is_featured: false,
      is_new: false,
      is_sale: false
    });
    console.log('Success:', res.data);
  } catch (e: any) {
    console.error('Failed:', e.response?.data || e.message);
  }
}
test();
