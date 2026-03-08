export const API_URL = 'http://localhost:5000/api';

export const api = {
  getToken: () => localStorage.getItem('token'),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch(e) {
      localStorage.removeItem('user');
      return null;
    }
  },
  
  headers() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  },

  async request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: this.headers()
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${API_URL}${endpoint}`, options);
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401 && endpoint !== '/auth/login') {
          this.clearAuth();
          window.location.href = '/login';
        }
        throw new Error(data.message || data.errors?.[0] || 'API Error');
      }
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  auth: {
    login: (credentials) => api.request('/auth/login', 'POST', credentials),
    register: (userData) => api.request('/auth/register', 'POST', userData)
  },
  
  expenses: {
    getAll: () => api.request('/expenses'),
    add: (expenseData) => api.request('/expenses', 'POST', expenseData),
    edit: (id, expenseData) => api.request(`/expenses/${id}`, 'PUT', expenseData),
    delete: (id) => api.request(`/expenses/${id}`, 'DELETE'),
    import: (expensesArray) => api.request('/expenses/import', 'POST', { expenses: expensesArray }),
    autoSync: (message) => api.request('/expenses/auto-sync', 'POST', { message })
  },
  
  budgets: {
    getAll: (month) => api.request(`/budgets${month ? `?month=${month}` : ''}`),
    set: (budgetData) => api.request('/budgets', 'POST', budgetData),
    delete: (id) => api.request(`/budgets/${id}`, 'DELETE')
  },
  
  goals: {
    getAll: () => api.request('/goals'),
    add: (goalData) => api.request('/goals', 'POST', goalData),
    delete: (id) => api.request(`/goals/${id}`, 'DELETE')
  },
  
  gst: {
    getAll: () => api.request('/gst'),
    add: (gstData) => api.request('/gst', 'POST', gstData),
    delete: (id) => api.request(`/gst/${id}`, 'DELETE')
  },

  insights: {
    get: (month) => api.request(`/insights?month=${month}`),
    goalInsights: (data) => api.request('/insights/goal-insights', 'POST', data)
  }
};
