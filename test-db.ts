import { createClient } from '@libsql/client';

const db = createClient({
  url: 'libsql://casagaming1-casagaming.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NDMwNTUsImlkIjoiMDE5Y2ZmNjQtODQwMS03OTE4LTkwYWMtYzg0NDVjMmU5YTJhIiwicmlkIjoiNmY0ZmRlMDYtMmYwYy00YzcyLTkxY2EtOGVmNDFjMGIxMDllIn0.EweA6uglQr4xeH5cXXbM6Jdlb9m8EMWzaRKMRbpQxOttCLaFI0Gn_2MurLDO-yo1e8eS_vavGGZcnn30oQqUDg'
});

async function test() {
  try {
    const res = await db.execute('SELECT 1');
    console.log('DB Connection Success:', res);
  } catch (e) {
    console.error('DB Connection Failed:', e);
  }
}
test();
