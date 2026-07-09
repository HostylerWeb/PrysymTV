import { apiRequest } from './client';

export function fetchCreatorDashboard() {
  return apiRequest<Record<string, unknown>>('/analytics/creators/me/dashboard');
}

export function trackAnalyticsEvents(events: unknown[]) {
  return apiRequest<unknown>('/analytics/track', {
    method: 'POST',
    body: { events },
    auth: false,
  });
}
