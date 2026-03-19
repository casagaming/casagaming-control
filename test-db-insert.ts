import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://casagaming1-casagaming.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NDMwNTUsImlkIjoiMDE5Y2ZmNjQtODQwMS03OTE4LTkwYWMtYzg0NDVjMmU5YTJhIiwicmlkIjoiNmY0ZmRlMDYtMmYwYy00YzcyLTkxY2EtOGVmNDFjMGIxMDllIn0.EweA6uglQr4xeH5cXXbM6Jdlb9m8EMWzaRKMRbpQxOttCLaFI0Gn_2MurLDO-yo1e8eS_vavGGZcnn30oQqUDg'
});

async function test() {
  try {
    const result = await db.execute({
      sql: "INSERT INTO products (name_ar, name_en, description_ar, description_en, price, original_price, image_url, images, category_id, stock, is_featured, is_new, is_sale, rating, reviews_count, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?) RETURNING *",
      args: ['test', 'test', 'test', 'test', 10, 12, '', '[]', 1, 10, 0, 0, 0, 'test-slug']
    });
    console.log('Success:', result);
  } catch (e) {
    console.error('Failed:', e);
  }
}
test();
