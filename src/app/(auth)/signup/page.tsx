import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { SignupFormClient } from "./signup-form-client"

export default async function SignupPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <SignupFormClient />
}
