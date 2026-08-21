import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMySubmittedReports } from "@/app/actions/reports"
import { ReportsClient } from "./reports-client"

export default async function StudentReportsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const res = await getMySubmittedReports()
  const reports = res.reports || []

  return <ReportsClient initialReports={reports} />
}
