"use client"

import * as React from "react"
import {
  FileCode,
  Plus,
  ExternalLink,
  Trash2,
  Loader2,
  File,
  FileArchive,
  FileImage,
  FolderOpen,
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
import { WorkspaceFile } from "@/app/actions/workspace"
import { addTeamFile, deleteTeamFile } from "@/app/actions/workspace"
import { toast } from "sonner"
import { MembershipRole } from "@prisma/client"

interface WorkspaceFilesPanelProps {
  teamId: string
  initialFiles: WorkspaceFile[]
  currentUserId: string
  currentUserRole: MembershipRole
}

export function WorkspaceFilesPanel({
  teamId,
  initialFiles,
  currentUserId,
  currentUserRole,
}: WorkspaceFilesPanelProps) {
  const [files, setFiles] = React.useState<WorkspaceFile[]>(initialFiles)
  const [isOpen, setIsOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState("")
  const [fileUrl, setFileUrl] = React.useState("")
  const [isPending, startTransition] = React.useTransition()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const isLeadership =
    currentUserRole === "LEADER" || currentUserRole === "CO_LEADER"

  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName.trim() || !fileUrl.trim() || isPending) return

    startTransition(async () => {
      const res = await addTeamFile({ teamId, fileName, fileUrl })
      if (res.error) {
        toast.error(res.error)
      } else if (res.file) {
        setFiles((prev) => [res.file!, ...prev])
        setFileName("")
        setFileUrl("")
        setIsOpen(false)
        toast.success("Shared file resource added!")
      }
    })
  }

  const handleDeleteFile = (fileId: string) => {
    setDeletingId(fileId)
    startTransition(async () => {
      const res = await deleteTeamFile({ teamId, fileId })
      if (res.error) {
        toast.error(res.error)
      } else {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
        toast.success("File resource removed.")
      }
      setDeletingId(null)
    })
  }

  const getFileIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".svg"))
      return <FileImage className="h-4 w-4 text-emerald-500" />
    if (lower.endsWith(".zip") || lower.endsWith(".tar") || lower.endsWith(".gz"))
      return <FileArchive className="h-4 w-4 text-amber-500" />
    if (lower.endsWith(".ts") || lower.endsWith(".tsx") || lower.endsWith(".json") || lower.endsWith(".py"))
      return <FileCode className="h-4 w-4 text-indigo-500" />
    return <File className="h-4 w-4 text-primary" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Shared Team Files
          </h3>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Share File Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddFile}>
              <DialogHeader>
                <DialogTitle>Share File Resource</DialogTitle>
                <DialogDescription className="text-xs">
                  Attach references to team drive files, design assets, datasets, or architecture diagrams.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 py-4">
                <div className="space-y-1.5">
                  <label htmlFor="file-name" className="text-xs font-medium text-foreground">
                    File Name
                  </label>
                  <Input
                    id="file-name"
                    placeholder="e.g. system-architecture-v1.pdf, training-dataset.csv"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    maxLength={150}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="file-url" className="text-xs font-medium text-foreground">
                    File URL
                  </label>
                  <Input
                    id="file-url"
                    type="url"
                    placeholder="https://drive.google.com/... or https://..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
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
                  disabled={!fileName.trim() || !fileUrl.trim() || isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Share File
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {files.length === 0 ? (
        <div className="p-6 rounded-lg border border-dashed border-border text-center space-y-2 bg-muted/20">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">No shared files yet</p>
            <p className="text-[11px] text-muted-foreground">
              Link design specs, diagrams, datasets, and presentation decks.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 mt-1"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" /> Share first file
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {files.map((file) => {
            const canDelete = isLeadership || file.uploader.id === currentUserId
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/80 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-md bg-muted shrink-0">
                    {getFileIcon(file.fileName)}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{file.fileName}</span>
                      <ExternalLink className="h-3 w-3 opacity-60 shrink-0 inline" />
                    </a>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Shared by {file.uploader.name} • {new Date(file.createdAt).toLocaleDateString()}
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
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${file.fileName}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === file.id}
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Delete file ${file.fileName}`}
                    >
                      {deletingId === file.id ? (
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
