import { apiRequest } from "@/lib/api-client";

export type ProgramItem = {
  slug: string;
  vertical: string;
  label: string;
  description: string;
  href: string;
};

export function fetchPrograms() {
  return apiRequest<{ items: ProgramItem[] }>("/programs", { auth: false });
}
