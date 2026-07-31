const BASE_URL = 'http://localhost/it_repair_api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'เกิดข้อผิดพลาด');
  return data;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<{ success: boolean; user: any }>('/login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (payload: any) =>
    request<{ success: boolean }>('/register.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Repair Requests
export const repairApi = {
  getAll: (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (role)   params.set('role', role);
    return request<{ success: boolean; data: any[] }>(`/repair_requests.php?${params}`);
  },
  getById: (id: string) =>
    request<{ success: boolean; data: any }>(`/repair_requests.php?id=${id}`),
  create: (payload: any) =>
    request<{ success: boolean; id: string; request_no: string }>('/repair_requests.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (payload: any) =>
    request<{ success: boolean }>('/repair_requests.php', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/repair_requests.php?id=${id}`, { method: 'DELETE' }),
};

// Users
export const usersApi = {
  getAll: (role?: string) => {
    const params = role ? `?role=${role}` : '';
    return request<{ success: boolean; data: any[] }>(`/users.php${params}`);
  },
  create: (payload: any) =>
    request<{ success: boolean }>('/users.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (payload: any) =>
    request<{ success: boolean }>('/users.php', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/users.php?id=${id}`, { method: 'DELETE' }),
};

// Stats
export const statsApi = {
  get: (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (role)   params.set('role', role);
    return request<any>(`/stats.php?${params}`);
  },
};

// Equipment Types
export const equipmentApi = {
  getAll: () =>
    request<{ success: boolean; data: any[] }>('/equipment_types.php'),
};
