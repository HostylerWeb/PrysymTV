import { ContentServiceGate } from "@/components/content-service-gate"

export default function VerticalsSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="verticals">{children}</ContentServiceGate>
}
