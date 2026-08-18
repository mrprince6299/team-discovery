import { getDiscoverableTeams, getAvailableEvents } from "@/app/actions/teams"
import { getAllAvailableSkills } from "@/app/actions/profile"
import { TeamsCatalogClient } from "@/components/teams/teams-catalog-client"

export const dynamic = "force-dynamic"

export default async function TeamsPage() {
  const [teams, events, skills] = await Promise.all([
    getDiscoverableTeams(),
    getAvailableEvents(),
    getAllAvailableSkills(),
  ])

  return (
    <TeamsCatalogClient
      initialTeams={teams}
      events={events}
      availableSkills={skills}
    />
  )
}
