const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function clampPage(value: unknown, fallback = DEFAULT_PAGE): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function clampLimit(value: unknown, fallback = DEFAULT_LIMIT, max = MAX_LIMIT): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

export function paginationSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
