import { ContentServiceGate } from "@/components/content-service-gate"

export default function PodcastsSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="podcasts">{children}</ContentServiceGate>
}
