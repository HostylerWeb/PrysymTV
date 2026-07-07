import { apiRequest } from "@/lib/api-client";

export type PublicGafProgram = {
  id: string;
  category: string;
  title: string;
  description: string | null;
};

export type PublicGafTransparency = {
  programs: PublicGafProgram[];
  summary: {
    totalInflowUsd: number;
    totalOutflowUsd: number;
    balanceUsd: number;
  };
  fundingByCategory: Array<{
    category: string | null;
    amountUsd: number;
  }>;
  recentGrants: Array<{
    id: string;
    amountUsd: number;
    category: string | null;
    programTitle: string | null;
    description: string | null;
    createdAt: string;
  }>;
};

export function fetchPublicGafTransparency() {
  return apiRequest<PublicGafTransparency>("/gaf/public", { auth: false });
}
