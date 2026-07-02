import { redirect } from "next/navigation"

/** Legacy URL — registration now opens as a modal on /advertise */
export default function AdvertisersRedirectPage() {
  redirect("/advertise?register=1")
}
