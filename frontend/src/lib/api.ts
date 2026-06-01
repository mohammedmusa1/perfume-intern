const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api';

interface FetchOptions {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<{ success: boolean; message?: string; data?: T; pagination?: { page: number; limit: number; total: number; totalPages: number }; error?: string }> {
  const { method = 'GET', body, token, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// Auth helpers
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('aura_token');
}

export function setToken(token: string): void {
  localStorage.setItem('aura_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
}

export function getUser(): { id: string; email: string; firstName: string; lastName: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('aura_user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: Record<string, unknown>): void {
  localStorage.setItem('aura_user', JSON.stringify(user));
}

// Formatting
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
