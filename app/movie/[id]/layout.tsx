import type { Metadata } from "next"
import { buildVideoMetadata } from "@/lib/api/server-videos"

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params
  return buildVideoMetadata(id)
}

export default function MovieLayout({ children }: LayoutProps) {
  return children
}
