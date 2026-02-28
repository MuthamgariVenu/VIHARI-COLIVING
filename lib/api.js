const API_BASE = '/api';

export async function apiCall(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export const authAPI = {
  login: (mobile, password, role) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password, role }),
    }),
};

export const branchAPI = {
  getAll: () => apiCall('/branches'),
  create: (data) => apiCall('/branches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/branches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const roomAPI = {
  getAll: () => apiCall('/rooms'),
  create: (data) => apiCall('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const bedAPI = {
  getAll: () => apiCall('/beds'),
  create: (data) => apiCall('/beds', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const managerAPI = {
  getAll: () => apiCall('/managers'),
  create: (data) => apiCall('/managers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (userId, data) => apiCall(`/managers/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (userId) => apiCall(`/managers/${userId}`, {
    method: 'DELETE',
  }),
};

export const tenantAPI = {
  getAll: () => apiCall('/tenants'),
  create: (data) => apiCall('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const paymentAPI = {
  getAll: () => apiCall('/payments'),
  create: (data) => apiCall('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const expenseAPI = {
  getAll: () => apiCall('/expenses'),
  create: (data) => apiCall('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const employeeAPI = {
  getAll: () => apiCall('/employees'),
  create: (data) => apiCall('/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  paySalary: (id, data) => apiCall(`/employees/${id}/pay-salary`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const complaintAPI = {
  getAll: () => apiCall('/complaints'),
  create: (data) => apiCall('/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const exitRequestAPI = {
  getAll: () => apiCall('/exit-requests'),
  create: (data) => apiCall('/exit-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiCall(`/exit-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  complete: (id) => apiCall(`/exit-requests/${id}/complete`, {
    method: 'POST',
  }),
};

export const dashboardAPI = {
  getAdminStats: () => apiCall('/dashboard/admin'),
  getManagerStats: () => apiCall('/dashboard/manager'),
  getTenantData: () => apiCall('/dashboard/tenant'),
};

export const alertAPI = {
  getAll: () => apiCall('/alerts'),
};

export const branchDetailsAPI = {
  getAll: () => apiCall('/branch-details'),
  getByBranchId: (branchId) => apiCall(`/branch-details/${branchId}`),
  create: (data) => apiCall('/branch-details', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (branchId, data) => apiCall(`/branch-details/${branchId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};