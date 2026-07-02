/** Allow only same-origin relative paths for post-auth redirects. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null
  const path = raw.trim()
  if (!path.startsWith("/") || path.startsWith("//")) return null
  return path
}

export function profileAuthHref(
  returnTo: string,
  auth?: "login" | "register",
): string {
  const params = new URLSearchParams({ returnTo })
  if (auth) params.set("auth", auth)
  return `/profile?${params.toString()}`
}
