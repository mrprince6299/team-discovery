import * as React from "react"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { AppShell } from "@/components/layout/app-shell"
import { logout } from "@/app/actions/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userSession = null
  if (authUser) {
    const [dbUser, unreadCount, adminRole] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authUser.id },
        select: {
          id: true,
          name: true,
          username: true,
          profilePhoto: true,
          verificationStatus: true,
        },
      }),
      prisma.notification.count({
        where: { userId: authUser.id, isRead: false },
      }),
      prisma.userRole.findFirst({
        where: { userId: authUser.id, role: "ADMIN" },
        select: { id: true },
      }),
    ])

    if (dbUser) {
      userSession = {
        id: dbUser.id,
        name: dbUser.name,
        email: authUser.email || "",
        verificationStatus: dbUser.verificationStatus,
        avatarUrl: dbUser.profilePhoto,
        unreadNotificationsCount: unreadCount,
        isAdmin: !!adminRole,
      }
    }
  }

  return (
    <AppShell user={userSession} onLogout={logout}>
      {children}
    </AppShell>
  )
}
