import type { Metadata } from "next"
import { buildCreatorMetadata } from "@/lib/api/server-users"

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { slug } = await params
  return buildCreatorMetadata(slug)
}

export default function CreatorLayout({ children }: LayoutProps) {
  return children
}
