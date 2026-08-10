import { ContentServiceGate } from "@/components/content-service-gate"

export default function ShortsSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ContentServiceGate service="shorts">{children}</ContentServiceGate>
}
