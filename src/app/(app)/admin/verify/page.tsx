import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin, getAdminVerificationList } from "@/app/actions/verification"
import { AdminVerifyClient } from "./admin-verify-client"

export default async function AdminVerificationPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminVerificationList()
  const requests = res.requests || []
  const counts = res.counts || { total: 0, pending: 0, approved: 0, rejected: 0 }

  return (
    <AdminVerifyClient
      initialRequests={requests}
      initialCounts={counts}
    />
  )
}
