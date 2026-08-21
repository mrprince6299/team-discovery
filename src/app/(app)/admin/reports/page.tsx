import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminReportsQueue } from "@/app/actions/admin-moderation"
import { AdminReportsClient } from "./admin-reports-client"

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminReportsQueue()
  if (res.error || !res.reports) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load moderation queue.</p>
      </div>
    )
  }

  return (
    <AdminReportsClient
      initialReports={res.reports}
      initialCounts={res.counts || { open: 0, inReview: 0, resolved: 0, dismissed: 0, total: 0 }}
    />
  )
}
