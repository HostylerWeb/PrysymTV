import { apiRequest } from './client';

export function postReport(body: {
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
}) {
  return apiRequest<unknown>('/reports', { method: 'POST', body });
}
