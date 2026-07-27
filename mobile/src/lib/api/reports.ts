import { apiRequest } from './client';

export type ReportTargetType =
  | 'video'
  | 'comment'
  | 'stream'
  | 'user'
  | 'podcast_episode'
  | 'vertical_episode';

export type ReportReason =
  | 'spam'
  | 'nudity'
  | 'violence'
  | 'harassment'
  | 'other';

export function postReport(body: {
  targetType: ReportTargetType | string;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  return apiRequest<unknown>('/reports', { method: 'POST', body });
}
