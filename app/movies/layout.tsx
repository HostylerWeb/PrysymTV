import { ContentServiceGate } from "@/components/content-service-gate"

export default function MoviesSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="movies">{children}</ContentServiceGate>
}
