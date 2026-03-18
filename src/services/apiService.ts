import { apiRequest } from './apiClient';
import type {
  AuthPayload,
  AuthResponse,
  DiscoverResponse,
  MatchesResponse,
  MessagesResponse,
  ProfileForm,
  SwipeAction,
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

export function getMe(token: string) {
  return apiRequest<{ user: User }>('/users/me', { method: 'GET' }, token);
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

export function getDiscoverProfiles(token: string) {
  return apiRequest<DiscoverResponse>('/discover', { method: 'GET' }, token);
}

export function swipeProfile(payload: { toUserId: string; action: SwipeAction }, token: string) {
  return apiRequest<{ success: boolean }>(
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
