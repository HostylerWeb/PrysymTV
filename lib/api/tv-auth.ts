import { apiRequest } from "@/lib/api-client";

export function approveTvLogin(userCode: string) {
  const normalized = userCode.replace(/-/g, "").trim().toUpperCase();
  const formatted =
    normalized.length === 8
      ? `${normalized.slice(0, 4)}-${normalized.slice(4)}`
      : userCode.trim().toUpperCase();
  return apiRequest<{ success: boolean; message?: string }>("/auth/tv/approve", {
    method: "POST",
    body: { userCode: formatted },
  });
}
