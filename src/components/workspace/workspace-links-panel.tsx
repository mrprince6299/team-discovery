"use client"

import * as React from "react"
import {
  Link as LinkIcon,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  Globe,
  Code2,
  Palette,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { WorkspaceLink } from "@/app/actions/workspace"
import { addTeamLink, deleteTeamLink } from "@/app/actions/workspace"
import { toast } from "sonner"
import type { MembershipRole } from "@prisma/client"

interface WorkspaceLinksPanelProps {
  teamId: string
  initialLinks: WorkspaceLink[]
  currentUserId: string
  currentUserRole: MembershipRole
}

export function WorkspaceLinksPanel({
  teamId,
  initialLinks,
  currentUserId,
  currentUserRole,
}: WorkspaceLinksPanelProps) {
  const [links, setLinks] = React.useState<WorkspaceLink[]>(initialLinks)
  const [isOpen, setIsOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const isLeadership =
    currentUserRole === "LEADER" || currentUserRole === "CO_LEADER"

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim() || isPending) return

    startTransition(async () => {
      const res = await addTeamLink({ teamId, title, url })
      if (res.error) {
        toast.error(res.error)
      } else if (res.link) {
        setLinks((prev) => [res.link!, ...prev])
        setTitle("")
        setUrl("")
        setIsOpen(false)
        toast.success("Shared resource link added!")
      }
    })
  }

  const handleDeleteLink = (linkId: string) => {
    setDeletingId(linkId)
    startTransition(async () => {
      const res = await deleteTeamLink({ teamId, linkId })
      if (res.error) {
        toast.error(res.error)
      } else {
        setLinks((prev) => prev.filter((l) => l.id !== linkId))
        toast.success("Resource link removed.")
      }
      setDeletingId(null)
    })
  }

  const getLinkIcon = (linkUrl: string) => {
    const lower = linkUrl.toLowerCase()
    if (lower.includes("github.com") || lower.includes("gitlab.com"))
      return <Code2 className="h-4 w-4 text-emerald-500" />
    if (lower.includes("figma.com") || lower.includes("dribbble.com"))
      return <Palette className="h-4 w-4 text-purple-500" />
    if (lower.includes("notion.so") || lower.includes("docs.google.com"))
      return <FileText className="h-4 w-4 text-blue-500" />
    return <Globe className="h-4 w-4 text-primary" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Shared Project Links
          </h3>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddLink}>
              <DialogHeader>
                <DialogTitle>Share Team Link</DialogTitle>
                <DialogDescription className="text-xs">
                  Share GitHub repositories, Figma designs, Notion workspaces, or project pitch documents with your squad.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 py-4">
                <div className="space-y-1.5">
                  <label htmlFor="link-title" className="text-xs font-medium text-foreground">
                    Link Title
                  </label>
                  <Input
                    id="link-title"
                    placeholder="e.g. GitHub Repository, Figma Design System"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="link-url" className="text-xs font-medium text-foreground">
                    URL
                  </label>
                  <Input
                    id="link-url"
                    type="url"
                    placeholder="https://github.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!title.trim() || !url.trim() || isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Add Resource Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {links.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-border text-center space-y-2 bg-muted/20">
          <Globe className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">No shared links yet</p>
            <p className="text-[11px] text-muted-foreground">
              Add your repository, design boards, and collaboration docs here.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 mt-1"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" /> Add first link
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {links.map((link) => {
            const canDelete = isLeadership || link.creator.id === currentUserId
            return (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-md bg-muted shrink-0">
                    {getLinkIcon(link.url)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="h-3 w-3 opacity-60 shrink-0 inline" />
                    </a>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Added by {link.creator.name} • {new Date(link.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${link.title}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === link.id}
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete link ${link.title}`}
                    >
                      {deletingId === link.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
