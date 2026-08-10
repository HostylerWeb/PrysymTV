import { ContentServiceGate } from "@/components/content-service-gate"

export default function MovieDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="movies">{children}</ContentServiceGate>
}
