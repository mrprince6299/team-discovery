import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { getMyActiveRecruitmentRoles } from "@/app/actions/matching"
import { DiscoveryClient } from "@/components/discovery/discovery-client"

interface DiscoverPageProps {
  searchParams: Promise<{
    role?: string
    candidate?: string
  }>
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const { role: preselectedRoleId, candidate: preselectedCandidateId } = await searchParams

  const [activeRoles, departments] = await Promise.all([
    getMyActiveRecruitmentRoles(),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <DiscoveryClient
      initialRoles={activeRoles}
      departments={departments}
      preselectedRoleId={preselectedRoleId}
      preselectedCandidateId={preselectedCandidateId}
    />
  )
}
