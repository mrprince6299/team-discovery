import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminTeamsList } from "@/app/actions/admin"
import { AdminTeamsClient } from "./admin-teams-client"

export default async function AdminTeamsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminTeamsList()
  if (res.error || !res.teams) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load team management data.</p>
      </div>
    )
  }

  return <AdminTeamsClient initialTeams={res.teams} initialCounts={res.counts!} />
}
