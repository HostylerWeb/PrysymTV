import { AdminContentVideoPage } from "@/components/admin/admin-content-video-page"

export default function AdminContentMoviesPage() {
  return (
    <AdminContentVideoPage
      title="Movies"
      description="Feature-length and long-form movie uploads."
      breadcrumbLabel="Movies"
      videoType="movie"
    />
  )
}
