import { apiRequest } from "@/lib/api-client";

export type AdvertiserAccount = {
  id: string;
  companyName: string;
  contactEmail: string;
  billingEmail: string | null;
  isVerified: boolean;
  createdAt: string;
  _count?: { campaigns: number };
};

export function registerAdvertiserAccount(body: {
  companyName: string;
  contactEmail: string;
  billingEmail?: string;
}) {
  return apiRequest<AdvertiserAccount>("/advertisers/register", {
    method: "POST",
    body,
  });
}

export function fetchMyAdvertiserAccounts() {
  return apiRequest<AdvertiserAccount[]>("/advertisers/me");
}

export function fetchMyAdvertiserAccount(id: string) {
  return apiRequest<AdvertiserAccount & { campaigns: unknown[] }>(
    `/advertisers/me/${id}`,
  );
}

export function cancelAdvertiserRegistration(id: string) {
  return apiRequest<{ ok: true }>(`/advertisers/me/${id}`, {
    method: "DELETE",
  });
}
