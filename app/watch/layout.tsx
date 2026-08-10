import { ContentServiceGate } from "@/components/content-service-gate"

export default function WatchSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="videos">{children}</ContentServiceGate>
}
