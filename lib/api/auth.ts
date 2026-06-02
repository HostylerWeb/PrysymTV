import { apiRequest, setAccessToken } from "@/lib/api-client";
import type { AuthSessionResponse, MessageResponse } from "@/lib/api/types";

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthSessionResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function register(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}) {
  const data = await apiRequest<AuthSessionResponse>("/auth/register", {
    method: "POST",
    auth: false,
    body: input,
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await apiRequest<MessageResponse>("/auth/logout", {
      method: "POST",
      auth: false,
    });
  } finally {
    setAccessToken(null);
  }
}

export async function forgotPassword(email: string) {
  return apiRequest<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest<MessageResponse>("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { token, newPassword },
  });
}

export function deriveUsername(displayName: string, email: string): string {
  const fromName = displayName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
  if (fromName.length >= 3) return fromName;
  const fromEmail = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
  return fromEmail.length >= 3 ? fromEmail : `user_${Date.now().toString(36)}`;
}
