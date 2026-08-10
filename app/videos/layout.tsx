import { ContentServiceGate } from "@/components/content-service-gate"

export default function VideosSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="videos">{children}</ContentServiceGate>
}
