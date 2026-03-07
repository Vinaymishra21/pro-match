import { apiRequest } from './apiClient';

export function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getMe(token) {
  return apiRequest('/users/me', { method: 'GET' }, token);
}

export function updateProfession(profession, token) {
  return apiRequest(
    '/users/profession',
    {
      method: 'PATCH',
      body: JSON.stringify({ profession })
    },
    token
  );
}

export function updateProfile(payload, token) {
  return apiRequest(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload)
    },
    token
  );
}

export function getDiscoverProfiles(token) {
  return apiRequest('/discover', { method: 'GET' }, token);
}

export function swipeProfile(payload, token) {
  return apiRequest(
    '/swipes',
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    token
  );
}

export function getMatches(token) {
  return apiRequest('/swipes/matches', { method: 'GET' }, token);
}

export function getMessages(matchId, token) {
  return apiRequest(`/messages/${matchId}`, { method: 'GET' }, token);
}

export function sendMessage(matchId, text, token) {
  return apiRequest(
    `/messages/${matchId}`,
    {
      method: 'POST',
      body: JSON.stringify({ text })
    },
    token
  );
}
