import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getStudentVerificationStatus } from "@/app/actions/verification"
import { StudentVerifyClient } from "./student-verify-client"

export default async function StudentVerificationPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const res = await getStudentVerificationStatus()
  if (res.error || !res.user) {
    redirect("/profile")
  }

  return (
    <StudentVerifyClient
      user={res.user}
      verificationRequest={res.verificationRequest}
    />
  )
}
