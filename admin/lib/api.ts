const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'promatch_admin_token';

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Auth expired/invalid → bounce to login.
    if ((res.status === 401 || res.status === 403) && typeof window !== 'undefined') {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    throw new ApiError((data as any)?.message || 'Request failed', res.status);
  }
  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; admin: { id: string; name: string; email: string } }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  stats: () => request<StatsResponse>('/admin/stats'),
  analytics: (days = 14) => request<AnalyticsResponse>(`/admin/analytics?days=${days}`),
  users: (params: { search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.page) q.set('page', String(params.page));
    return request<UsersResponse>(`/admin/users?${q.toString()}`);
  },
  user: (id: string) => request<{ user: any }>(`/admin/users/${id}`),
  userAction: (id: string, action: string) =>
    request<{ user: any }>(`/admin/users/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
  reports: (params: { status?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.page) q.set('page', String(params.page));
    return request<ReportsResponse>(`/admin/reports?${q.toString()}`);
  },
  updateReport: (id: string, body: { status?: string; banUser?: boolean }) =>
    request<{ ok: boolean }>(`/admin/reports/${id}`, { method: 'POST', body: JSON.stringify(body) }),
  matches: (params: { page?: number }) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    return request<MatchesResponse>(`/admin/matches?${q.toString()}`);
  },
  conversation: (id: string) => request<ConversationResponse>(`/admin/matches/${id}/messages`)
};

// ---------- Types ----------
export type StatsResponse = {
  stats: {
    users: number;
    active: number;
    deactivated: number;
    verified: number;
    pro: number;
    matches: number;
    messages: number;
    reportsOpen: number;
  };
  byProfession: { profession: string; count: number }[];
};

export type SeriesPoint = { day: string; count: number };
export type AnalyticsResponse = {
  days: number;
  signups: SeriesPoint[];
  matches: SeriesPoint[];
  messages: SeriesPoint[];
  byGender: { gender: string; count: number }[];
  verified: { verified: number; unverified: number };
  revenue: { proInr: number; creditsInr: number; totalInr: number; estimated: boolean };
  packs: { id: string; priceInr: number; credits: number }[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profession: string;
  age: number | null;
  gender: string;
  tier: string;
  credits: number;
  professionVerified: boolean;
  isDeactivated: boolean;
  isAdmin: boolean;
  photo: string;
  createdAt: string;
};

export type UsersResponse = { total: number; page: number; pages: number; users: AdminUser[] };

export type AdminReport = {
  id: string;
  reason: string;
  note: string;
  status: string;
  alsoBlocked: boolean;
  createdAt: string;
  reporter: { id: string; name: string; profession: string } | null;
  reportedUser: { id: string; name: string; profession: string; isDeactivated: boolean; photo: string } | null;
};

export type ReportsResponse = { total: number; page: number; pages: number; reports: AdminReport[] };

export type AdminMatch = {
  id: string;
  status: string;
  crossProfession: boolean;
  createdAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  userA: { id: string; name: string; profession: string } | null;
  userB: { id: string; name: string; profession: string } | null;
};

export type MatchesResponse = { total: number; page: number; pages: number; matches: AdminMatch[] };

export type ConversationResponse = {
  match: { id: string; userA: { id: string; name: string } | null; userB: { id: string; name: string } | null };
  messages: { id: string; senderId: string; text: string; createdAt: string }[];
};
