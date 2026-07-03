/** Normalize route/query username params (strip @ / %40, lowercase). */
export function normalizeUsername(username: string): string {
  let raw = username.trim();
  if (!raw) return raw;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // keep raw as-is
  }
  return raw.replace(/^@+/, '').toLowerCase();
}
