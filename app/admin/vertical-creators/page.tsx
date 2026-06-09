import { redirect } from "next/navigation"

export default function AdminVerticalCreatorsRedirectPage() {
  redirect("/admin/applications?type=vertical")
}
