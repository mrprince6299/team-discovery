import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getDashboardData } from "@/app/actions/dashboard"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const { data, error } = await getDashboardData()

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <h2 className="text-xl font-bold text-destructive">Unable to Load Dashboard</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || "An unexpected error occurred while loading your command center."}
        </p>
      </div>
    )
  }

  return <DashboardClient data={data} />
}
