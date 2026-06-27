import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  status: number;
  errors?: { field: string; message: string }[];

  constructor(message: string, status: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message || 'Request failed',
      response.status,
      data.errors
    );
  }

  return data.data as T;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ user: { id: number; name: string; email: string }; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    login: (body: { email: string; password: string }) =>
      request<{ user: { id: number; name: string; email: string }; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) }
      ),
    me: () => request<{ id: number; name: string; email: string }>('/auth/me'),
  },

  boards: {
    list: () => request<import('../types').Board[]>('/boards'),
    get: (id: number) => request<import('../types').Board>(`/boards/${id}`),
    create: (body: { title: string; description?: string }) =>
      request<import('../types').Board>('/boards', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: { title: string; description?: string }) =>
      request<import('../types').Board>(`/boards/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) =>
      request<{ message: string }>(`/boards/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (boardId: number, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<import('../types').Task[]>(`/tasks/${boardId}/tasks${query}`);
    },
    create: (boardId: number, body: Record<string, unknown>) =>
      request<import('../types').Task>(`/tasks/${boardId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: Record<string, unknown>) =>
      request<import('../types').Task>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    move: (id: number, body: { status: string; position?: number }) =>
      request<import('../types').Task>(`/tasks/${id}/move`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    delete: (id: number) =>
      request<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' }),
    search: (params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      return request<import('../types').Task[]>(`/tasks/search?${query}`);
    },
  },

  ai: {
    suggestEstimate: (body: { title: string; description?: string }) =>
      request<import('../types').EstimateSuggestion>('/ai/suggest-estimate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    naturalLanguage: (input: string) =>
      request<{
        title: string;
        description: string;
        priority: string;
        status: string;
        dueDate: string | null;
        estimatedEffort: string | null;
      }>('/ai/natural-language', {
        method: 'POST',
        body: JSON.stringify({ input }),
      }),
    suggestSubtasks: (body: { title: string; description?: string }) =>
      request<{ subtasks: string[] }>('/ai/suggest-subtasks', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  analytics: {
    dashboard: () => request<import('../types').AnalyticsData>('/analytics/dashboard'),
  },
};

export { ApiError };
