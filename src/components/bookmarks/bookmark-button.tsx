"use client"

import * as React from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleBookmark } from "@/app/actions/bookmarks"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  targetType: "USER" | "TEAM" | "PROJECT"
  targetId: string
  initialIsBookmarked?: boolean
  onToggleSuccess?: (isBookmarked: boolean) => void
  size?: "default" | "sm" | "icon"
  variant?: "ghost" | "outline" | "secondary" | "default"
  className?: string
  showLabel?: boolean
}

export function BookmarkButton({
  targetType,
  targetId,
  initialIsBookmarked = false,
  onToggleSuccess,
  size = "icon",
  variant = "ghost",
  className,
  showLabel = false,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = React.useState(initialIsBookmarked)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return
    setIsLoading(true)

    // Optimistic UI update
    const previousState = isBookmarked
    const nextState = !previousState
    setIsBookmarked(nextState)

    try {
      const res = await toggleBookmark({ targetType, targetId })
      if (res.error) {
        setIsBookmarked(previousState)
        toast.error(res.error)
      } else if (res.isBookmarked !== undefined) {
        setIsBookmarked(res.isBookmarked)
        if (res.isBookmarked) {
          toast.success("Saved to your shortlist!")
        } else {
          toast.info("Removed from saved items.")
        }
        onToggleSuccess?.(res.isBookmarked)
      }
    } catch {
      setIsBookmarked(previousState)
      toast.error("Failed to update bookmark. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const label = isBookmarked
    ? `Remove ${targetType.toLowerCase()} from saved items`
    : `Save ${targetType.toLowerCase()} to shortlist`

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={label}
      aria-pressed={isBookmarked}
      title={label}
      className={cn(
        "relative transition-all duration-200 motion-safe:active:scale-95 shrink-0",
        isBookmarked
          ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Bookmark
        className={cn(
          "size-4 transition-all duration-200",
          isBookmarked && "fill-current"
        )}
      />
      {showLabel && (
        <span className="text-xs font-medium ml-1.5">
          {isBookmarked ? "Saved" : "Save"}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </Button>
  )
}
