import { apiRequest } from "@/lib/api-client";

export type StoreProduct = {
  id: string;
  productType: "merchandise" | "digital" | "ticket" | "course";
  title: string;
  description: string | null;
  priceUsd: number;
  imageUrl: string | null;
  digitalUrl: string | null;
  inventory: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatorStoreSummary = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  bannerUrl: string | null;
  isPublished: boolean;
  createdAt: string;
};

export function fetchMyStore() {
  return apiRequest<{ store: CreatorStoreSummary; products: StoreProduct[] }>(
    "/stores/me",
  );
}

export type PublicStoreProduct = {
  id: string;
  productType: "merchandise" | "digital" | "ticket" | "course";
  title: string;
  description: string | null;
  priceUsd: number;
  imageUrl: string | null;
  inventory: number | null;
  createdAt: string;
};

export function fetchCreatorStore(username: string) {
  const slug = username.replace(/^@/, "");
  return apiRequest<{ store: CreatorStoreSummary; products: PublicStoreProduct[] }>(
    `/users/${encodeURIComponent(slug)}/store`,
    { auth: false },
  );
}

export function createMyStoreProduct(body: {
  productType: "merchandise" | "digital";
  title: string;
  description?: string;
  priceUsd: number;
  imageUrl: string;
  digitalUrl?: string;
  inventory?: number;
}) {
  return apiRequest<StoreProduct>("/stores/me/products", {
    method: "POST",
    body,
  });
}

export function deleteMyStoreProduct(id: string) {
  return apiRequest<{ success: boolean }>(`/stores/me/products/${id}`, {
    method: "DELETE",
  });
}
