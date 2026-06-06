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

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
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
