import { ContentServiceGate } from "@/components/content-service-gate"

export default function PodcastDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="podcasts">{children}</ContentServiceGate>
}
