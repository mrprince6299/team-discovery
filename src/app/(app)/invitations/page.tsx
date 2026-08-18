import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMyInvitations } from "@/app/actions/invitations"
import { InvitationsDashboardClient } from "@/components/invitations/invitations-dashboard-client"

export const dynamic = "force-dynamic"

export default async function InvitationsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const { receivedInvitations, sentInvitations, isLeader } = await getMyInvitations()

  return (
    <InvitationsDashboardClient
      initialReceivedInvitations={receivedInvitations}
      initialSentInvitations={sentInvitations}
      isLeader={isLeader}
    />
  )
}
