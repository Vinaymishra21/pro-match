import { API_BASE_URL } from '../constants/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// The app registers a handler here so a dead session (invalid/expired token, or
// a deleted/banned account) clears itself and routes to login — instead of the
// user hitting "Invalid token" on every request.
let onAuthError: (() => void) | null = null;
export function setAuthErrorHandler(fn: (() => void) | null) {
  onAuthError = fn;
}

function isDeadSession(status: number, data: any): boolean {
  if (status === 401 && (data?.code === 'NO_ACCOUNT' || data?.message === 'Invalid token')) return true;
  if (status === 403 && data?.code === 'BANNED') return true;
  return false;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (isDeadSession(response.status, data)) {
      onAuthError?.();
    }
    const message = data?.message || 'Request failed';
    throw new ApiError(message, response.status, data?.code);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token = ''): Promise<T> {
  // For multipart (FormData) bodies, let fetch set the Content-Type + boundary.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string> | undefined) || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  return parseResponse<T>(response);
}
