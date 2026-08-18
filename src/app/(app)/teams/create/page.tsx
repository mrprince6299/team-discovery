import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getAvailableEvents } from "@/app/actions/teams"
import { getAllAvailableSkills } from "@/app/actions/profile"
import { TeamCreateClient } from "@/components/teams/team-create-client"

export const dynamic = "force-dynamic"

export default async function TeamCreatePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const [events, skills] = await Promise.all([
    getAvailableEvents(),
    getAllAvailableSkills(),
  ])

  return (
    <TeamCreateClient
      events={events}
      availableSkills={skills}
    />
  )
}
