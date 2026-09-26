import api from './api';

const get = (url, params) => api.get(url, { params }).then((res) => res.data);
const post = (url, payload) => api.post(url, payload).then((res) => res.data);
const put = (url, payload) => api.put(url, payload).then((res) => res.data);
const remove = (url, payload) => api.delete(url, { data: payload }).then((res) => res.data);

export const productService = {
  list: (params) => get('/products', params),
  options: () => get('/products/options'),
  get: (id) => get(`/products/${id}`),
  create: (payload) => post('/products', payload),
  update: (id, payload) => put(`/products/${id}`, payload),
  remove: (id) => remove(`/products/${id}`),
};

export const categoryService = {
  list: (params) => get('/categories', params),
  create: (payload) => post('/categories', payload),
  update: (id, payload) => put(`/categories/${id}`, payload),
  remove: (id, payload) => remove(`/categories/${id}`, payload),
};

export const warehouseService = {
  list: (params) => get('/warehouses', params),
  create: (payload) => post('/warehouses', payload),
  update: (id, payload) => put(`/warehouses/${id}`, payload),
  locations: (params) => get('/locations', params),
  createLocation: (payload) => post('/warehouses/locations', payload),
  updateLocation: (id, payload) => put(`/warehouses/locations/${id}`, payload),
};

export const reorderService = {
  list: (params) => get('/reorder-rules', params),
  save: (payload) => post('/reorder-rules', payload),
  remove: (id) => remove(`/reorder-rules/${id}`),
};

export const dashboardService = {
  get: (params) => get('/dashboard', params),
  alerts: () => get('/alerts'),
  users: () => get('/users'),
};

export const ledgerService = {
  list: (params) => get('/ledger', params),
};

function documentService(path) {
  return {
    list: (params) => get(`/${path}`, params),
    get: (id) => get(`/${path}/${id}`),
    create: (payload) => post(`/${path}`, payload),
    update: (id, payload) => put(`/${path}/${id}`, payload),
    validate: (id) => post(`/${path}/${id}/validate`),
    cancel: (id) => post(`/${path}/${id}/cancel`),
  };
}

export const receiptService = documentService('receipts');
export const deliveryService = documentService('deliveries');
export const transferService = documentService('transfers');
export const adjustmentService = documentService('adjustments');
