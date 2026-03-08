const API_URL = 'http://localhost:5000/api';

const api = {
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
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  headers: function() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
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
          // Auto logout on unauthorized
          this.clearAuth();
          window.location.href = 'login.html';
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
    import: (expensesArray) => api.request('/expenses/import', 'POST', { expenses: expensesArray })
  },
  
  budgets: {
    getAll: (month) => api.request(`/budgets${month ? `?month=${month}` : ''}`),
    set: (budgetData) => api.request('/budgets', 'POST', budgetData)
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
    get: (month) => api.request(`/insights?month=${month}`)
  }
};
