import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // serializes arrays as key=val1&key=val2 (repeat) instead of key[]=val
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
  deleteBatch: (id) => api.delete(`/inventory/batches/${id}`),
  getBatches: (params) => api.get('/inventory/batches', { params }),
  getAllBatches: (params) => api.get('/inventory/batches/all', { params }),
  getBatchNumbers: (params) => api.get('/inventory/batches/numbers', { params }),
  getAvailableDenominations: (params) => api.get('/inventory/batches/denominations', { params }),
  getInventorySummary: () => api.get('/inventory/batches/summary'),
  getBatchById: (id) => api.get(`/inventory/batches/${id}`),
  getBatchCards: (id) => api.get(`/inventory/batches/${id}/cards`),
  getBatchSerialRanges: (id) => api.get(`/inventory/batches/${id}/ranges`),
  getLotSerialRanges: (batchNumber) => api.get(`/inventory/batches/lot/${encodeURIComponent(batchNumber)}/ranges`),
  getLotCards: (batchNumber) => api.get(`/inventory/batches/lot/${encodeURIComponent(batchNumber)}/cards`),
  generateBatch: (data) => api.post('/inventory/batches/generate', data),
  getAvailableSerialRange: (denominationId) => api.get(`/inventory/denominations/${denominationId}/available-range`),
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
  delete: (id) => api.delete(`/distributors/${id}`),
  toggleStatus: (id) => api.patch(`/distributors/${id}/toggle-status`),
  updateStatus: (id, status) => api.patch(`/distributors/${id}/status`, null, { params: { status } }),
  walletAdjustment: (data) => api.post('/distributors/wallet-adjustment', data),
  getTransactions: (id, params) => api.get(`/distributors/${id}/transactions`, { params }),
  getAllTransactions: (params) => api.get('/distributors/transactions/all', { params }),
};

export const reportService = {
  getDashboardSummary: () => api.get('/dashboard/summary'),
  getFinancialReport: (params) => api.get('/reports/financial', { params }),
};

export const campaignService = {
  getCampaigns: (params) => api.get('/campaigns', { params }),
  getCampaignById: (id) => api.get(`/campaigns/${id}`),
  createCampaignExpense: (data) => api.post('/campaigns', data),
  addCardExpenses: (id, data) => api.post(`/campaigns/${id}/items`, data),
  updateCampaign: (id, data) => api.put(`/campaigns/${id}`, data),
  getCalculationSummary: (params) => api.get('/campaigns/summary', { params }),
};

export default api;

