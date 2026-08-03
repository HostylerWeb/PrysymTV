/** Treat template OAuth IDs as unset so buttons are hidden in production. */

export function isPlaceholderGoogleClientId(
  id: string | null | undefined,
): boolean {
  if (!id?.trim()) return true;
  const value = id.trim().toLowerCase();
  return (
    value.includes("your-web-client-id") ||
    value.includes("web-id.apps") ||
    value.includes("example") ||
    value.includes("placeholder")
  );
}

export function isPlaceholderAppleClientId(
  id: string | null | undefined,
): boolean {
  if (!id?.trim()) return true;
  const value = id.trim().toLowerCase();
  return value === "com.prysym.web" || value.includes("your-apple");
}

export function isPlaceholderFacebookAppId(
  id: string | null | undefined,
): boolean {
  if (!id?.trim()) return true;
  const value = id.trim().toLowerCase();
  return (
    value.includes("your-facebook-app-id") ||
    value.includes("example") ||
    value === "1234567890" ||
    value.includes("placeholder")
  );
}

export function sanitizeGoogleClientId(
  id: string | null | undefined,
): string | null {
  if (!id?.trim() || isPlaceholderGoogleClientId(id)) return null;
  return id.trim();
}

export function sanitizeAppleClientId(
  id: string | null | undefined,
): string | null {
  if (!id?.trim() || isPlaceholderAppleClientId(id)) return null;
  return id.trim();
}

export function sanitizeFacebookAppId(
  id: string | null | undefined,
): string | null {
  if (!id?.trim() || isPlaceholderFacebookAppId(id)) return null;
  return id.trim();
}
