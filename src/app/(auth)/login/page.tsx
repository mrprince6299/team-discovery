import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LoginFormClient } from "./login-form-client"

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return <LoginFormClient />
}
