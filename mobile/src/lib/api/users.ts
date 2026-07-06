import type { MeResponse } from '@/types/api';
import { apiRequest } from './client';

export async function fetchMe() {
  return apiRequest<MeResponse>('/users/me');
}

export async function applyStreamer(description: string, idDocumentUrl: string) {
  return apiRequest<{ message: string; streamerStatus?: string }>('/users/apply-streamer', {
    method: 'POST',
    body: { description, idDocumentUrl },
  });
}

export async function applyVerticalCreator(
  description: string,
  idDocumentUrl: string,
  portfolioUrl?: string,
) {
  return apiRequest<{ message: string; verticalCreatorStatus?: string }>(
    '/users/apply-vertical-creator',
    {
      method: 'POST',
      body: { description, idDocumentUrl, portfolioUrl },
    },
  );
}

export async function requestCreatorAccess(body: {
  features: Array<'vertical' | 'live' | 'store'>;
  description?: string;
  acceptedStoreTerms?: boolean;
}) {
  return apiRequest<{
    success: boolean;
    identityVerified: boolean;
    results: Record<string, string>;
  }>('/users/request-creator-access', {
    method: 'POST',
    body,
  });
}
