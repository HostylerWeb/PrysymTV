import { apiRequest } from './client';

export type TvAuthStartResponse = {
  sessionId: string;
  userCode: string;
  pollToken: string;
  verificationUrl: string;
  expiresAt: string;
  pollIntervalMs: number;
};

export type TvAuthPollResponse = {
  status: 'pending' | 'approved' | 'expired' | 'consumed';
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
};

export function startTvAuthSession() {
  return apiRequest<TvAuthStartResponse>('/auth/tv/start', {
    method: 'POST',
    auth: false,
  });
}

export function pollTvAuthSession(sessionId: string, pollToken: string) {
  const params = new URLSearchParams({ sessionId, pollToken });
  return apiRequest<TvAuthPollResponse>(`/auth/tv/poll?${params}`, { auth: false });
}
