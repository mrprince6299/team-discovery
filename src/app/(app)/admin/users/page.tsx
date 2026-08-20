import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminUsersList } from "@/app/actions/admin"
import { AdminUsersClient } from "./admin-users-client"

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminUsersList()
  if (res.error || !res.users) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load user management data.</p>
      </div>
    )
  }

  return <AdminUsersClient initialUsers={res.users} initialCounts={res.counts!} />
}
