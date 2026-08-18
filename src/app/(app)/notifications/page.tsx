import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { getMyNotifications } from "@/app/actions/notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { Bell } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  const { notifications = [], unreadCount = 0 } = await getMyNotifications("ALL")

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Bell className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Stay updated on squad applications, invitations, peer reviews, and announcements.
          </p>
        </div>
      </div>

      {/* Notification Stream */}
      <NotificationList
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </div>
  )
}
