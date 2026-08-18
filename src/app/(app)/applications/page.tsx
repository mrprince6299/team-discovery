import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMyApplications } from "@/app/actions/applications"
import { ApplicationsDashboardClient } from "@/components/applications/applications-dashboard-client"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const { sentApplications, receivedApplications, isLeader } = await getMyApplications()

  return (
    <ApplicationsDashboardClient
      initialSentApplications={sentApplications}
      initialReceivedApplications={receivedApplications}
      isLeader={isLeader}
    />
  )
}
