import { apiRequest } from './apiClient';
import type {
  AuthPayload,
  AuthResponse,
  BillingCatalog,
  BoostActivateResponse,
  BoostStatusResponse,
  CreateOrderResponse,
  DiscoverAccessResponse,
  DiscoverProfile,
  DiscoverResponse,
  GrantResponse,
  IncomingLikesResponse,
  MatchesResponse,
  MessageRecord,
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

// Submits a profession-verification REQUEST for admin review (no longer an
// instant self-serve verify). Returns the user + the request status.
export function requestProfessionVerification(token: string, note?: string) {
  return apiRequest<{ user: User; status: 'pending' | 'verified' }>(
    '/users/verify-profession',
    { method: 'POST', body: JSON.stringify(note ? { note } : {}) },
    token
  );
}

export function deactivateAccount(token: string) {
  return apiRequest<{ ok: boolean }>('/users/deactivate', { method: 'POST' }, token);
}

export function deleteAccount(token: string) {
  return apiRequest<{ ok: boolean }>('/users/me', { method: 'DELETE' }, token);
}

// --- Safety ---------------------------------------------------------------

export function blockUser(userId: string, token: string) {
  return apiRequest<{ ok: boolean }>(
    '/safety/block',
    { method: 'POST', body: JSON.stringify({ userId }) },
    token
  );
}

export function unblockUser(userId: string, token: string) {
  return apiRequest<{ ok: boolean }>(
    '/safety/unblock',
    { method: 'POST', body: JSON.stringify({ userId }) },
    token
  );
}

export function getBlockedUsers(token: string) {
  return apiRequest<{ blocked: { id: string; name: string; profession: string; photo: string }[] }>(
    '/safety/blocked',
    { method: 'GET' },
    token
  );
}

export function unmatch(matchId: string, token: string) {
  return apiRequest<{ ok: boolean }>(
    '/safety/unmatch',
    { method: 'POST', body: JSON.stringify({ matchId }) },
    token
  );
}

export function getReportReasons(token: string) {
  return apiRequest<{ reasons: string[] }>('/safety/report-reasons', { method: 'GET' }, token);
}

export function reportUser(
  payload: { userId: string; reason: string; note?: string; alsoBlock?: boolean },
  token: string
) {
  return apiRequest<{ ok: boolean; blocked: boolean }>(
    '/safety/report',
    { method: 'POST', body: JSON.stringify(payload) },
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
  minHeightCm?: number;
  maxHeightCm?: number;
  genders?: string[];
  lookingFor?: string[];
  religions?: string[];
  languages?: string[];
  verifiedOnly?: boolean;
};

export function getDiscoverProfiles(token: string, profession?: string, filters?: DiscoverFilters) {
  const params = new URLSearchParams();
  if (profession) params.set('profession', profession);
  if (filters?.minAge) params.set('minAge', String(filters.minAge));
  if (filters?.maxAge) params.set('maxAge', String(filters.maxAge));
  if (filters?.minHeightCm) params.set('minHeightCm', String(filters.minHeightCm));
  if (filters?.maxHeightCm) params.set('maxHeightCm', String(filters.maxHeightCm));
  if (filters?.genders?.length) params.set('genders', filters.genders.join(','));
  if (filters?.lookingFor?.length) params.set('lookingFor', filters.lookingFor.join(','));
  if (filters?.religions?.length) params.set('religions', filters.religions.join(','));
  if (filters?.languages?.length) params.set('languages', filters.languages.join(','));
  if (filters?.verifiedOnly) params.set('verifiedOnly', 'true');
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
  payload: { type: 'pro' | 'credits'; packId?: string; planId?: string },
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

export function swipeProfile(
  payload: { toUserId: string; action: SwipeAction; superLike?: boolean },
  token: string
) {
  return apiRequest<SwipeResponse>(
    '/swipes',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export function getBoostStatus(token: string) {
  return apiRequest<BoostStatusResponse>('/boost/status', { method: 'GET' }, token);
}

export function activateBoost(token: string) {
  return apiRequest<BoostActivateResponse>('/boost/activate', { method: 'POST' }, token);
}

export function undoSwipe(token: string) {
  return apiRequest<{ ok: boolean; profile: DiscoverProfile | null }>(
    '/swipes/undo',
    { method: 'POST' },
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
  return apiRequest<{ message: MessageRecord }>(
    `/messages/${matchId}`,
    {
      method: 'POST',
      body: JSON.stringify({ text })
    },
    token
  );
}
