import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminAnalytics } from "@/app/actions/admin"
import { AdminAnalyticsClient } from "./admin-analytics-client"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminAnalytics()
  if (res.error || !res.users) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load analytics data.</p>
      </div>
    )
  }

  return <AdminAnalyticsClient data={res} />
}
