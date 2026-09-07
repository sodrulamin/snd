import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('snd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('snd_token');
        localStorage.removeItem('snd_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const inventoryService = {
  getDenominations: () => api.get('/inventory/denominations'),
  getAllDenominations: () => api.get('/inventory/denominations'),
  getActiveDenominations: () => api.get('/inventory/denominations/active'),
  createDenomination: (data) => api.post('/inventory/denominations', data),
  updateDenomination: (id, data) => api.put(`/inventory/denominations/${id}`, data),
  deleteDenomination: (id) => api.delete(`/inventory/denominations/${id}`),
  getBatches: () => api.get('/inventory/batches'),
  getAllBatches: () => api.get('/inventory/batches'),
  getBatchById: (id) => api.get(`/inventory/batches/${id}`),
  generateBatch: (data) => api.post('/inventory/batches/generate', data),
  searchCards: (params) => api.get('/inventory/cards', { params }),
  getAvailableSerialRange: (denominationId) => api.get(`/inventory/denominations/${denominationId}/available-range`),
  exportCardsCsvUrl: (batchId, orderId, includePlainPin) => {
    const params = new URLSearchParams();
    if (batchId) params.append('batchId', batchId);
    if (orderId) params.append('orderId', orderId);
    if (includePlainPin) params.append('includePlainPin', 'true');
    return `/api/inventory/cards/export/csv?${params.toString()}`;
  }
};

export const salesService = {
  createOrder: (data) => api.post('/sales/orders', data),
  getOrders: (params) => api.get('/sales/orders', { params }),
  getOrderById: (id) => api.get(`/sales/orders/${id}`),
  getInvoice: (id) => api.get(`/sales/orders/${id}/invoice`),
};

export const distributorService = {
  getAll: () => api.get('/distributors'),
  getById: (id) => api.get(`/distributors/${id}`),
  create: (data) => api.post('/distributors', data),
  update: (id, data) => api.put(`/distributors/${id}`, data),
  walletAdjustment: (data) => api.post('/distributors/wallet-adjustment', data),
  getTransactions: (id, params) => api.get(`/distributors/${id}/transactions`, { params }),
  getAllTransactions: (params) => api.get('/distributors/transactions/all', { params }),
};

export const reportService = {
  getDashboardSummary: () => api.get('/dashboard/summary'),
  getFinancialReport: (params) => api.get('/reports/financial', { params }),
};


export default api;
