"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bookmark,
  ArrowRight,
  Trash2,
  Code2,
  Globe,
  Compass,
  AlertCircle,
  Calendar,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMyBookmarks, toggleBookmark, BookmarkItem } from "@/app/actions/bookmarks"
import { toast } from "sonner"

interface SavedItemsSheetProps {
  children?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  triggerClassName?: string
}

export function SavedItemsSheet({
  children,
  isOpen,
  onOpenChange,
  triggerClassName,
}: SavedItemsSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<BookmarkItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<string>("all")

  const isControlled = isOpen !== undefined
  const sheetOpen = isControlled ? isOpen : open
  const handleOpenChange = (val: boolean) => {
    if (!isControlled) setOpen(val)
    onOpenChange?.(val)
    if (val) {
      fetchItems()
    }
  }

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await getMyBookmarks()
      if (res.data) {
        setItems(res.data)
      } else if (res.error) {
        toast.error(res.error)
      }
    } catch {
      toast.error("Failed to load saved items.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (item: BookmarkItem) => {
    try {
      const res = await toggleBookmark({
        targetType: item.targetType,
        targetId: item.targetId,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
        toast.info("Removed from saved items.")
      }
    } catch {
      toast.error("Failed to remove bookmark.")
    }
  }

  const candidateItems = items.filter((i) => i.targetType === "USER")
  const teamItems = items.filter((i) => i.targetType === "TEAM")
  const projectItems = items.filter((i) => i.targetType === "PROJECT")

  const getFilteredItems = () => {
    switch (activeTab) {
      case "candidates":
        return candidateItems
      case "teams":
        return teamItems
      case "projects":
        return projectItems
      default:
        return items
    }
  }

  const filteredItems = getFilteredItems()

  return (
    <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
      {children && <SheetTrigger asChild className={triggerClassName}>{children}</SheetTrigger>}

      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-background border-l border-border/80">
        <SheetHeader className="p-5 pb-3 border-b border-border/40 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-amber-500 fill-current" />
              <SheetTitle className="text-base font-bold text-foreground">
                Saved Shortlist
              </SheetTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Manage your shortlisted talent, project squads, and inspiration portfolios.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-5 pt-3 border-b border-border/30">
            <TabsList className="grid grid-cols-4 h-8 bg-muted/60 p-0.5">
              <TabsTrigger value="all" className="text-xs">
                All ({items.length})
              </TabsTrigger>
              <TabsTrigger value="candidates" className="text-xs">
                People ({candidateItems.length})
              </TabsTrigger>
              <TabsTrigger value="teams" className="text-xs">
                Teams ({teamItems.length})
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-xs">
                Projects ({projectItems.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mb-2" />
                <span>Loading your saved shortlist...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-xl border border-dashed border-border/80 bg-muted/20 my-auto">
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-3">
                  <Bookmark className="size-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  No Saved {activeTab === "all" ? "Items" : activeTab}
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mb-4">
                  Bookmark candidates in Discovery, teams in the catalog, or portfolio projects to access them quickly here.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium"
                  onClick={() => handleOpenChange(false)}
                >
                  <Link href="/discover">
                    <Compass className="size-3.5 mr-1" />
                    <span>Explore Discovery</span>
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative flex flex-col p-3.5 rounded-xl border border-border/70 bg-card/70 hover:bg-card hover:border-primary/40 transition-all duration-200 gap-2.5 shadow-2xs"
                  >
                    {/* 1. USER ITEM */}
                    {item.targetType === "USER" && item.user && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10 rounded-lg border border-border shrink-0">
                            <AvatarImage src={item.user.profilePhoto || undefined} alt={item.user.name} />
                            <AvatarFallback className="text-xs font-bold bg-muted">
                              {item.user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/users/${item.user.id}`}
                              onClick={() => handleOpenChange(false)}
                              className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {item.user.name}
                            </Link>
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{item.user.username}
                              {item.user.departmentName && ` · ${item.user.departmentName}`}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-medium tracking-wider h-3.5 px-1 mt-1"
                            >
                              {item.user.availability.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenChange(false)}
                          >
                            <Link href={`/users/${item.user.id}`}>
                              <span>Profile</span>
                              <ArrowRight className="size-3 ml-1" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item)}
                            title="Remove from saved"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 2. TEAM ITEM */}
                    {item.targetType === "TEAM" && item.team && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <Link
                              href={`/teams/${item.team.id}`}
                              onClick={() => handleOpenChange(false)}
                              className="text-xs font-bold text-foreground hover:text-primary transition-colors truncate"
                            >
                              {item.team.name}
                            </Link>
                            <Badge
                              variant={item.team.status === "ACTIVE" ? "success" : "secondary"}
                              className="text-[9px] font-semibold h-3.5 px-1"
                            >
                              {item.team.status}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.team.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                            {item.team.eventName && (
                              <span className="flex items-center gap-1">
                                <Calendar className="size-2.5" />
                                <span className="truncate max-w-[120px]">{item.team.eventName}</span>
                              </span>
                            )}
                            <span>{item.team.openRolesCount} open role{item.team.openRolesCount !== 1 ? "s" : ""}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenChange(false)}
                          >
                            <Link href={`/teams/${item.team.id}`}>
                              <span>Team</span>
                              <ArrowRight className="size-3 ml-1" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item)}
                            title="Remove from saved"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 3. PROJECT ITEM */}
                    {item.targetType === "PROJECT" && item.project && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-foreground truncate mb-0.5">
                            {item.project.title}
                          </h5>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.project.description}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              by {item.project.creator.name} ({item.project.role})
                            </span>
                            {item.project.skills.slice(0, 2).map((s) => (
                              <Badge
                                key={s.id}
                                variant="outline"
                                className="text-[9px] h-3.5 px-1 border-border/80"
                              >
                                {s.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.project.demoLink && (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                            >
                              <a
                                href={item.project.demoLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Live Demo"
                              >
                                <Globe className="size-3.5" />
                              </a>
                            </Button>
                          )}
                          {item.project.githubLink && (
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                            >
                              <a
                                href={item.project.githubLink}
                                target="_blank"
                                rel="noreferrer"
                                title="GitHub Repository"
                              >
                                <Code2 className="size-3.5" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(item)}
                            title="Remove from saved"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 4. UNAVAILABLE ITEM */}
                    {!item.isAvailable && (
                      <div className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <AlertCircle className="size-4 text-amber-500" />
                          <span>This {item.targetType.toLowerCase()} is no longer available.</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(item)}
                          title="Remove broken bookmark"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
