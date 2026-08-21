import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getStudentVerificationStatus } from "@/app/actions/verification"
import { getAllAvailableSkills, getAllCollegesAndDepartments } from "@/app/actions/profile"
import { OnboardingWizard, OnboardingInitialData } from "@/components/onboarding/onboarding-wizard"

export const dynamic = "force-dynamic"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const [verificationData, skills, colleges] = await Promise.all([
    getStudentVerificationStatus(),
    getAllAvailableSkills(),
    getAllCollegesAndDepartments(),
  ])

  if ("error" in verificationData || !verificationData.user) {
    redirect("/profile")
  }

  const u = verificationData.user

  const initialData: OnboardingInitialData = {
    name: u.name,
    username: u.username,
    collegeEmail: u.email,
    erp: u.erp,
    college: u.college,
    program: u.program,
    branch: u.branch,
    year: u.year,
    primaryRole: u.primaryRole,
    bio: u.bio,
    availability: u.availability as any || "AVAILABLE",
    skills: u.skills as any,
    interests: u.interests as any,
  }

  return (
    <div className="py-4">
      <OnboardingWizard
        initialData={initialData}
        availableSkills={skills.map((s) => ({ id: s.id, name: s.name }))}
        colleges={colleges.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}
