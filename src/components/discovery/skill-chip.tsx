"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"

interface SkillChipProps {
  name: string
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string
  isMatched?: boolean
  isRequired?: boolean
  relatedToRequired?: string
  className?: string
}

export function SkillChip({
  name,
  level,
  isMatched = false,
  isRequired = false,
  relatedToRequired,
  className,
}: SkillChipProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
        isMatched
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
          : relatedToRequired
          ? "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300 font-medium"
          : "border-border/80 bg-muted/20 text-muted-foreground"
      } ${className || ""}`}
    >
      {isMatched && <Check className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
      {relatedToRequired && <Sparkles className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />}
      <span className="font-semibold text-foreground">{name}</span>
      {relatedToRequired && (
        <span className="text-[10px] text-muted-foreground">(~{relatedToRequired})</span>
      )}
      {level && (
        <Badge
          variant={
            level === "ADVANCED"
              ? "exact"
              : level === "INTERMEDIATE"
              ? "secondary"
              : "outline"
          }
          className="text-[9px] px-1 py-0 uppercase"
        >
          {level}
        </Badge>
      )}
      {isRequired && (
        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Required
        </span>
      )}
    </div>
  )
}
