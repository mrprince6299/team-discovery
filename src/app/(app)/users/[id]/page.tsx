import { notFound } from "next/navigation"
import { getPublicProfile, getCandidateRoleFit, getViewerActiveRoles } from "@/app/actions/profile"
import { createClient } from "@/utils/supabase/server"
import { CandidateProfileView } from "@/components/profile/candidate-profile-view"

export const dynamic = "force-dynamic"

interface PublicProfilePageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ roleId?: string }>
}

export default async function PublicProfilePage({ params, searchParams }: PublicProfilePageProps) {
  const { id } = await params
  const { roleId } = (await searchParams) || {}

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const [profile, roleFit, viewerActiveRoles] = await Promise.all([
    getPublicProfile(id, authUser?.id),
    roleId ? getCandidateRoleFit(id, roleId) : Promise.resolve(null),
    authUser ? getViewerActiveRoles(authUser.id) : Promise.resolve([]),
  ])

  if (!profile) {
    notFound()
  }

  const isOwner = authUser?.id === profile.id

  return (
    <CandidateProfileView
      profile={profile}
      isOwner={isOwner}
      roleFit={roleFit}
      viewerActiveRoles={viewerActiveRoles}
    />
  )
}
