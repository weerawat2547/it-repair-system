// ⚙️ ตรวจจับสภาพแวดล้อมอัตโนมัติ
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost/it_repair_api'
  : 'https://pajamas-luckless-operation.ngrok-free.dev/it_repair_api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 🔑 เพิ่ม header ngrok เฉพาะเวลาไม่ได้รันบน localhost (ตอนขึ้น Vercel/มือถือ)
  if (!import.meta.env.DEV) {
    defaultHeaders['ngrok-skip-browser-warning'] = 'true';
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    }

    return data;
  } catch (error: any) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
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
    if (role) params.set('role', role);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<{ success: boolean; data: any[] }>(`/repair_requests.php${queryString}`);
  },
  getById: (id: string) =>
    request<{ success: boolean; data: any }>(`/repair_requests.php?id=${encodeURIComponent(id)}`),
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
    request<{ success: boolean }>(`/repair_requests.php?id=${encodeURIComponent(id)}`, { 
      method: 'DELETE' 
    }),
};

// Users
export const usersApi = {
  getAll: (role?: string) => {
    const queryString = role ? `?role=${encodeURIComponent(role)}` : '';
    return request<{ success: boolean; data: any[] }>(`/users.php${queryString}`);
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
    request<{ success: boolean }>(`/users.php?id=${encodeURIComponent(id)}`, { 
      method: 'DELETE' 
    }),
};

// Stats
export const statsApi = {
  get: (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', userId);
    if (role) params.set('role', role);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`/stats.php${queryString}`);
  },
};

// Equipment Types
export const equipmentApi = {
  getAll: () =>
    request<{ success: boolean; data: any[] }>('/equipment_types.php'),
};