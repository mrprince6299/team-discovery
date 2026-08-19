import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { VerifyEmailClient } from "./verify-email-client"

interface VerifyPageProps {
  searchParams?: Promise<{ email?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // If user is already authenticated and has a confirmed email, redirect directly to dashboard
  if (authUser && authUser.email_confirmed_at) {
    redirect("/dashboard")
  }

  let userRecord = null
  if (authUser) {
    userRecord = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { privateData: true },
    })
  }

  const email =
    resolvedSearchParams.email ||
    userRecord?.privateData?.collegeEmail ||
    authUser?.email ||
    ""

  return (
    <VerifyEmailClient
      initialEmail={email}
      isAuthenticated={!!authUser}
      isEmailConfirmed={!!authUser?.email_confirmed_at}
    />
  )
}
