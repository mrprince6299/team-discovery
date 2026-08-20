import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminEventsList } from "@/app/actions/events"
import { AdminEventsClient } from "./admin-events-client"

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminEventsList()
  if (res.error || !res.events) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load events management data.</p>
      </div>
    )
  }

  return <AdminEventsClient initialEvents={res.events} initialCounts={res.counts!} />
}
