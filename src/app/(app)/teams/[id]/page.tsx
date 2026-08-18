import { notFound } from "next/navigation"
import { getTeamDetails } from "@/app/actions/teams"
import { TeamDetailsClient } from "@/components/teams/team-details-client"

export const dynamic = "force-dynamic"

interface TeamDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  const { id } = await params
  const team = await getTeamDetails(id)

  if (!team) {
    notFound()
  }

  return <TeamDetailsClient team={team} />
}
