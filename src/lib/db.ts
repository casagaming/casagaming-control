import { createClient } from "@libsql/client/web";

const url = "https://casagaming1-casagaming.aws-eu-west-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NDMwNTUsImlkIjoiMDE5Y2ZmNjQtODQwMS03OTE4LTkwYWMtYzg0NDVjMmU5YTJhIiwicmlkIjoiNmY0ZmRlMDYtMmYwYy00YzcyLTkxY2EtOGVmNDFjMGIxMDllIn0.EweA6uglQr4xeH5cXXbM6Jdlb9m8EMWzaRKMRbpQxOttCLaFI0Gn_2MurLDO-yo1e8eS_vavGGZcnn30oQqUDg";

export const db = createClient({
  url,
  authToken,
});
