import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldAlert, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { getTeamWorkspace } from "@/app/actions/workspace"
import { WorkspaceClient } from "@/components/workspace/workspace-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Team Collaboration Workspace | Team Discovery",
  description: "Real-time team chat, shared documents, resource links, and member directory for active squads.",
}

interface WorkspacePageProps {
  params: Promise<{ id: string }>
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/teams/${id}/workspace`)
  }

  const { error, workspace } = await getTeamWorkspace(id)

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full border-destructive/20 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-lg">Workspace Access Restricted</CardTitle>
            <CardDescription className="text-xs">
              {error || "You are not an active member of this team."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5 pt-2">
            <Button asChild className="w-full text-xs">
              <Link href={`/teams/${id}`}>
                <Users className="h-3.5 w-3.5 mr-1.5" />
                View Public Team Details
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-xs">
              <Link href="/teams">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Browse All Teams
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <WorkspaceClient
      workspace={workspace}
      currentUserId={user.id}
    />
  )
}
