/** Bare username for URLs and API paths (admin, not @admin or %40admin). */
export function normalizeUsernameSlug(username: string): string {
  let slug = username.trim();
  if (!slug) return slug;
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // keep slug as-is
  }
  return slug.replace(/^@+/, '').replace(/^%40/i, '');
}

export function usernamesMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return normalizeUsernameSlug(a) === normalizeUsernameSlug(b);
}

export function creatorPath(username: string): string {
  return `/creator/${normalizeUsernameSlug(username)}`;
}

export function creatorStorePath(username: string): string {
  return `${creatorPath(username)}/store`;
}

export function creatorStoreProductPath(username: string, productId: string): string {
  return `${creatorStorePath(username)}/${productId}`;
}

export function creatorStoreCartPath(username: string): string {
  return `${creatorStorePath(username)}/cart`;
}
