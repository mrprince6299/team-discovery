import { redirect, notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isCurrentUserAdmin } from "@/app/actions/verification"
import { getAdminTaxonomy } from "@/app/actions/admin"
import { AdminTaxonomyClient } from "./admin-taxonomy-client"

export default async function AdminTaxonomyPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    notFound()
  }

  const res = await getAdminTaxonomy()
  if (res.error || !res.canonicalSkills) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <p className="text-destructive font-semibold">Failed to load taxonomy data.</p>
      </div>
    )
  }

  return <AdminTaxonomyClient data={res} />
}
