export const MOCK_FACEBOOK_TOKEN = "ui-preview-facebook-token"

export function isPreviewOAuthToken(token: string): boolean {
  return token.startsWith("ui-preview-")
}

export function isPlaceholderFacebookAppId(id: string | null | undefined): boolean {
  if (!id?.trim()) return true
  const value = id.trim().toLowerCase()
  return (
    value.includes("your-facebook-app-id") ||
    value.includes("example") ||
    value === "1234567890"
  )
}

export function canUseFacebookWebLogin(): boolean {
  if (typeof window === "undefined") return false
  return window.location.protocol === "https:"
}
