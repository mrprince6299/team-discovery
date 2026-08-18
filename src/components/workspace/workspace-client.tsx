"use client"

import * as React from "react"
import {
  MessageSquare,
  Users,
  Link as LinkIcon,
  FolderOpen,
  Activity,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamWorkspaceData } from "@/app/actions/workspace"
import { WorkspaceHeader } from "./workspace-header"
import { WorkspaceChat } from "./workspace-chat"
import { WorkspaceMembersPanel } from "./workspace-members-panel"
import { WorkspaceLinksPanel } from "./workspace-links-panel"
import { WorkspaceFilesPanel } from "./workspace-files-panel"
import { WorkspaceActivityPanel } from "./workspace-activity-panel"

interface WorkspaceClientProps {
  workspace: TeamWorkspaceData
  currentUserId: string
}

export function WorkspaceClient({
  workspace,
  currentUserId,
}: WorkspaceClientProps) {
  const {
    team,
    currentMember,
    members,
    messages,
    links,
    files,
    activities,
  } = workspace

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. Header */}
      <WorkspaceHeader
        team={team}
        currentMember={currentMember}
        memberCount={members.length}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Desktop View (Dual Column) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          {/* Left / Main Column: Conversation Feed */}
          <section
            aria-label="Team Conversation"
            className="lg:col-span-7 xl:col-span-8"
          >
            <WorkspaceChat
              teamId={team.id}
              initialMessages={messages}
              currentUserId={currentUserId}
            />
          </section>

          {/* Right Column: Multi-Tab Collaboration Hub */}
          <section
            aria-label="Team Collaboration Resources"
            className="lg:col-span-5 xl:col-span-4 bg-card rounded-xl border border-border p-4 shadow-xs"
          >
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid grid-cols-4 w-full h-9 mb-4 p-1">
                <TabsTrigger value="members" className="text-xs gap-1 px-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>Members</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="text-xs gap-1 px-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Links</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs gap-1 px-1">
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Files</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs gap-1 px-1">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Activity</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-0">
                <WorkspaceMembersPanel
                  members={members}
                  currentUserId={currentUserId}
                  teamId={team.id}
                  teamName={team.name}
                />
              </TabsContent>

              <TabsContent value="links" className="mt-0">
                <WorkspaceLinksPanel
                  teamId={team.id}
                  initialLinks={links}
                  currentUserId={currentUserId}
                  currentUserRole={currentMember.membershipRole}
                />
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <WorkspaceFilesPanel
                  teamId={team.id}
                  initialFiles={files}
                  currentUserId={currentUserId}
                  currentUserRole={currentMember.membershipRole}
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <WorkspaceActivityPanel activities={activities} />
              </TabsContent>
            </Tabs>
          </section>
        </div>

        {/* Mobile / Tablet View (Tabs Layout) */}
        <div className="lg:hidden">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid grid-cols-5 w-full h-10 mb-4 p-1">
              <TabsTrigger value="chat" className="text-xs gap-1 px-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Feed</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs gap-1 px-1">
                <Users className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Members</span>
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs gap-1 px-1">
                <LinkIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Links</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs gap-1 px-1">
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1 px-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-0">
              <WorkspaceChat
                teamId={team.id}
                initialMessages={messages}
                currentUserId={currentUserId}
              />
            </TabsContent>

            <TabsContent value="members" className="mt-0 bg-card rounded-xl border border-border p-4">
              <WorkspaceMembersPanel
                members={members}
                currentUserId={currentUserId}
                teamId={team.id}
                teamName={team.name}
              />
            </TabsContent>

            <TabsContent value="links" className="mt-0 bg-card rounded-xl border border-border p-4">
              <WorkspaceLinksPanel
                teamId={team.id}
                initialLinks={links}
                currentUserId={currentUserId}
                currentUserRole={currentMember.membershipRole}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-0 bg-card rounded-xl border border-border p-4">
              <WorkspaceFilesPanel
                teamId={team.id}
                initialFiles={files}
                currentUserId={currentUserId}
                currentUserRole={currentMember.membershipRole}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-0 bg-card rounded-xl border border-border p-4">
              <WorkspaceActivityPanel activities={activities} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
