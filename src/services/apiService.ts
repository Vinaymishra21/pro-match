import { apiRequest } from './apiClient';
import type {
  AuthPayload,
  AuthResponse,
  BillingCatalog,
  CreateOrderResponse,
  DiscoverAccessResponse,
  DiscoverResponse,
  GrantResponse,
  IncomingLikesResponse,
  MatchesResponse,
  MessagesResponse,
  OtpRequestResponse,
  OtpVerifyResponse,
  ProfileForm,
  RevealResponse,
  SwipeAction,
  SwipeResponse,
  User
} from '../types';

export function register(payload: AuthPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function login(payload: AuthPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function requestOtp(phone: string) {
  return apiRequest<OtpRequestResponse>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone })
  });
}

export function verifyOtp(phone: string, code: string) {
  return apiRequest<OtpVerifyResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code })
  });
}

export function getMe(token: string) {
  return apiRequest<{ user: User }>('/users/me', { method: 'GET' }, token);
}

// Uploads a local image (file:// URI from the picker) as multipart/form-data
// and returns the hosted URL to persist on the profile.
export async function uploadPhoto(localUri: string, token: string): Promise<{ url: string }> {
  const form = new FormData();
  const name = localUri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const extMatch = /\.(\w+)$/.exec(name);
  const ext = (extMatch?.[1] || 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  // React Native's FormData accepts this {uri,name,type} shape for file parts.
  form.append('photo', { uri: localUri, name, type } as unknown as Blob);

  return apiRequest<{ url: string }>(
    '/uploads/photo',
    { method: 'POST', body: form },
    token
  );
}

export function registerPushToken(pushToken: string, token: string) {
  return apiRequest<{ ok: boolean }>(
    '/users/push-token',
    {
      method: 'PATCH',
      body: JSON.stringify({ pushToken })
    },
    token
  );
}

export function updateProfession(profession: string, token: string) {
  return apiRequest<{ user: User }>(
    '/users/profession',
    {
      method: 'PATCH',
      body: JSON.stringify({ profession })
    },
    token
  );
}

export function updateProfile(payload: Partial<ProfileForm>, token: string) {
  return apiRequest<{ user: User }>(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    token
  );
}

export type DiscoverFilters = {
  minAge?: number;
  maxAge?: number;
  genders?: string[];
  lookingFor?: string[];
};

export function getDiscoverProfiles(token: string, profession?: string, filters?: DiscoverFilters) {
  const params = new URLSearchParams();
  if (profession) params.set('profession', profession);
  if (filters?.minAge) params.set('minAge', String(filters.minAge));
  if (filters?.maxAge) params.set('maxAge', String(filters.maxAge));
  if (filters?.genders?.length) params.set('genders', filters.genders.join(','));
  if (filters?.lookingFor?.length) params.set('lookingFor', filters.lookingFor.join(','));
  const qs = params.toString();
  return apiRequest<DiscoverResponse>(`/discover${qs ? `?${qs}` : ''}`, { method: 'GET' }, token);
}

export function getDiscoverAccess(token: string) {
  return apiRequest<DiscoverAccessResponse>('/discover/access', { method: 'GET' }, token);
}

export function getIncomingLikes(token: string) {
  return apiRequest<IncomingLikesResponse>('/likes/incoming', { method: 'GET' }, token);
}

export function revealLiker(likerId: string, token: string) {
  return apiRequest<RevealResponse>(
    '/likes/reveal',
    { method: 'POST', body: JSON.stringify({ likerId }) },
    token
  );
}

export function getBillingCatalog(token: string) {
  return apiRequest<BillingCatalog>('/billing/catalog', { method: 'GET' }, token);
}

// Test-only entitlement grant (works while backend BILLING_DEV_MODE=true).
export function devGrant(
  payload: { type: 'pro' | 'credits'; packId?: string },
  token: string
) {
  return apiRequest<GrantResponse>(
    '/billing/dev/grant',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export function createOrder(
  payload: { type: 'pro' | 'credits'; packId?: string },
  token: string
) {
  return apiRequest<CreateOrderResponse>(
    '/billing/create-order',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export function verifyPayment(
  payload: {
    type: 'pro' | 'credits';
    packId?: string;
    orderId: string;
    paymentId: string;
    signature: string;
  },
  token: string
) {
  return apiRequest<GrantResponse>(
    '/billing/verify',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export function swipeProfile(payload: { toUserId: string; action: SwipeAction }, token: string) {
  return apiRequest<SwipeResponse>(
    '/swipes',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export function getMatches(token: string) {
  return apiRequest<MatchesResponse>('/swipes/matches', { method: 'GET' }, token);
}

export function getMessages(matchId: string, token: string) {
  return apiRequest<MessagesResponse>(`/messages/${matchId}`, { method: 'GET' }, token);
}

export function sendMessage(matchId: string, text: string, token: string) {
  return apiRequest<{ message: string }>(
    `/messages/${matchId}`,
    {
      method: 'POST',
      body: JSON.stringify({ text })
    },
    token
  );
}
