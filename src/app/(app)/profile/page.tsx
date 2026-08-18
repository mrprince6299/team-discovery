import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import {
  getMyProfile,
  getAllAvailableSkills,
  getAllCollegesAndDepartments,
} from "@/app/actions/profile"
import { ProfileEditorClient } from "./profile-editor-client"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  let profile = null
  try {
    profile = await getMyProfile()
  } catch {
    redirect("/login")
  }

  const [availableSkills, colleges] = await Promise.all([
    getAllAvailableSkills(),
    getAllCollegesAndDepartments(),
  ])

  return (
    <ProfileEditorClient
      initialProfile={profile}
      availableSkills={availableSkills}
      colleges={colleges}
    />
  )
}
