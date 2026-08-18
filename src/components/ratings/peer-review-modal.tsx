'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StarRatingInput } from '@/components/ratings/star-rating-input'
import { submitPeerRating } from '@/app/actions/ratings'
import { toast } from 'sonner'
import { Star, Loader2, Sparkles } from 'lucide-react'

interface PeerReviewModalProps {
  teamId: string
  teamName: string
  rateeId: string
  rateeName: string
  triggerButton?: React.ReactNode
  onSuccess?: () => void
}

export function PeerReviewModal({
  teamId,
  teamName,
  rateeId,
  rateeName,
  triggerButton,
  onSuccess,
}: PeerReviewModalProps) {
  const [open, setOpen] = React.useState(false)
  const [score, setScore] = React.useState<number>(5)
  const [feedback, setFeedback] = React.useState<string>('')
  const [isPending, startTransition] = React.useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (score < 1 || score > 5 || isPending) return

    startTransition(async () => {
      const res = await submitPeerRating({
        teamId,
        rateeId,
        score,
        feedback: feedback.trim() || undefined,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Peer review for ${rateeName} submitted successfully!`)
        setOpen(false)
        setFeedback('')
        setScore(5)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            Rate Teammate
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Peer Review for {rateeName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Leave a verified peer endorsement for your collaboration in squad{' '}
              <strong className="text-foreground">{teamName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Collaboration Rating <span className="text-rose-500">*</span>
              </label>
              <StarRatingInput
                value={score}
                onChange={setScore}
                disabled={isPending}
              />
            </div>

            {/* Optional Written Feedback */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="peer-feedback"
                  className="font-semibold text-foreground"
                >
                  Constructive Feedback{' '}
                  <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {feedback.length}/1000
                </span>
              </div>
              <Textarea
                id="peer-feedback"
                placeholder={`How was it working with ${rateeName}? Highlight technical strengths, reliability, communication, or code contributions...`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={1000}
                rows={4}
                disabled={isPending}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || score < 1 || score > 5}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Submit Verified Review
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
