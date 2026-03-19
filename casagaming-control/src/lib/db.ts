const BASE = '';

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const db = {
  categories: {
    list: () => req<any[]>('GET', '/api/categories'),
    create: (data: any) => req<any>('POST', '/api/categories', data),
    update: (id: string, data: any) => req<any>('PUT', `/api/categories/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/api/categories/${id}`),
  },
  products: {
    list: () => req<any[]>('GET', '/api/products'),
    create: (data: any) => req<any>('POST', '/api/products', data),
    update: (id: string, data: any) => req<any>('PUT', `/api/products/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/api/products/${id}`),
  },
  orders: {
    list: () => req<any[]>('GET', '/api/orders'),
    create: (data: any) => req<any>('POST', '/api/orders', data),
    updateStatus: (id: string, status: string) => req<any>('PATCH', `/api/orders/${id}/status`, { status }),
  },
  shippingRates: {
    list: () => req<any[]>('GET', '/api/shipping-rates'),
    update: (id: string, data: any) => req<any>('PUT', `/api/shipping-rates/${id}`, data),
  },
  storeConfig: {
    get: () => req<any>('GET', '/api/store-config'),
    save: (data: any) => req<any>('PUT', '/api/store-config', data),
  },
  banners: {
    list: () => req<any[]>('GET', '/api/banners'),
    create: (data: any) => req<any>('POST', '/api/banners', data),
    update: (id: string, data: any) => req<any>('PUT', `/api/banners/${id}`, data),
    delete: (id: string) => req<any>('DELETE', `/api/banners/${id}`),
  },
  stats: {
    get: () => req<any>('GET', '/api/stats'),
  },
};
