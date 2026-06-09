import { redirect } from "next/navigation"

export default function AdminStreamersRedirectPage() {
  redirect("/admin/applications?type=streamer")
}
