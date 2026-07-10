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

// A free-tier backend can sleep and take ~30-40s to wake. Without a timeout,
// React Native's fetch fails fast with a bare "Network request failed"; with
// one attempt it gives up before the server is up. So: bound each attempt and
// retry a couple of times, which comfortably outlasts a cold start.
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2; // 3 attempts total (~60s worst case)
const RETRY_BASE_DELAY_MS = 800;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * True only for failures where we never got an HTTP response: a dropped
 * connection, or our own timeout abort. An ApiError means the server DID
 * answer (4xx/5xx) — that's a real result, never retry it.
 */
function isTransientNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return false;
  const name = (err as { name?: string } | null)?.name;
  const message = String((err as { message?: string } | null)?.message ?? '');
  return name === 'AbortError' || name === 'TypeError' || /network request failed/i.test(message);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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

  // Only retry idempotent reads. Retrying a POST/PATCH could duplicate a side
  // effect (spend credits twice, double-swipe) when the request actually
  // reached the server but the response was lost.
  const method = (options.method || 'GET').toUpperCase();
  const retries = method === 'GET' || method === 'HEAD' ? MAX_RETRIES : 0;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}${path}`,
        { ...options, headers },
        REQUEST_TIMEOUT_MS
      );
      return await parseResponse<T>(response);
    } catch (err) {
      lastError = err;
      // Stop on a real HTTP answer, or once we've used our attempts.
      if (attempt === retries || !isTransientNetworkError(err)) break;
      await sleep(RETRY_BASE_DELAY_MS * (attempt + 1)); // 0.8s, then 1.6s
    }
  }

  if (isTransientNetworkError(lastError)) {
    // Clearer than React Native's bare "Network request failed".
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, 'NETWORK');
  }
  throw lastError;
}
