"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resendVerificationEmail, logout } from "@/app/actions/auth"
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  LogOut,
  Sparkles,
  Inbox,
} from "lucide-react"

interface VerifyEmailClientProps {
  initialEmail?: string
  isAuthenticated: boolean
  isEmailConfirmed: boolean
}

export function VerifyEmailClient({
  initialEmail = "",
  isAuthenticated,
  isEmailConfirmed,
}: VerifyEmailClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [isPending, startTransition] = useTransition()
  const [isChecking, startCheckTransition] = useTransition()
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle")
  const [resendMessage, setResendMessage] = useState<string>("")
  const [cooldown, setCooldown] = useState(0)

  // Countdown timer for cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  const handleResend = () => {
    if (!email.trim()) {
      setResendStatus("error")
      setResendMessage("Please enter your registered email address.")
      return
    }

    setResendStatus("idle")
    setResendMessage("")

    startTransition(async () => {
      try {
        const res = await resendVerificationEmail(email.trim())
        if (res?.error) {
          setResendStatus("error")
          setResendMessage(res.error)
        } else {
          setResendStatus("success")
          setResendMessage("Verification email resent! Please check your inbox and spam folder.")
          setCooldown(60) // 60s cooldown
        }
      } catch (err) {
        setResendStatus("error")
        setResendMessage(err instanceof Error ? err.message : "Failed to resend verification email.")
      }
    })
  }

  const handleCheckStatus = () => {
    startCheckTransition(() => {
      router.refresh()
      router.push("/dashboard")
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-muted/20 selection:bg-primary selection:text-primary-foreground">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-1">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
            TD
          </span>
          <span className="font-bold text-xl tracking-tight text-foreground">Team Discovery</span>
        </Link>
        <p className="text-xs text-muted-foreground">Account &amp; Security Verification</p>
      </div>

      <Card className="w-full max-w-lg border-border/80 bg-card shadow-xl rounded-2xl overflow-hidden">
        {/* Visual Header Banner */}
        <div className="p-6 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-border/60 flex flex-col items-center justify-center text-center space-y-3">
          <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-inner text-primary">
            <Mail className="size-8 animate-pulse" />
          </div>
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs uppercase tracking-wider text-primary border-primary/30 bg-primary/10 font-semibold">
            <Inbox className="size-3.5" />
            <span>Verification Link Sent</span>
          </Badge>
        </div>

        <CardHeader className="text-center space-y-2 pt-6">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Check your email
          </CardTitle>

          <CardDescription className="text-xs sm:text-sm max-w-md mx-auto leading-relaxed text-muted-foreground">
            We&apos;ve sent a verification link to your email address.
            Please check your inbox and click the link to verify your email.
            Once verified, come back and log in to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 text-xs">
          {/* Registered Email Display Box */}
          {email ? (
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Sent to email address
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-semibold text-foreground truncate">
                    {email}
                  </div>
                </div>
              </div>
              <Badge variant={isEmailConfirmed ? "success" : "secondary"} className="shrink-0 text-[10px] font-medium">
                {isEmailConfirmed ? "Verified" : "Pending"}
              </Badge>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Registered Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.edu"
                className="h-10 text-xs"
              />
            </div>
          )}

          {/* Feedback Alerts */}
          {resendStatus === "success" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{resendMessage}</span>
            </div>
          )}

          {resendStatus === "error" && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* Helpful Tips Box */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2 text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Didn&apos;t receive the email?</span>
            </div>
            <ul className="space-y-1 text-[11px] list-disc list-inside">
              <li>Check your spam, junk, or promotions folder.</li>
              <li>Wait 1–2 minutes for the mail server delivery.</li>
              <li>Click the button below to send a fresh verification link.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-6 border-t border-border/60 bg-muted/10">
          {/* Action Buttons */}
          <div className="w-full space-y-2.5">
            {/* Resend Verification Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={isPending || cooldown > 0}
              className="w-full h-10 gap-2 font-semibold border-primary/40 hover:bg-primary/5 text-foreground"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Sending Verification Link...</span>
                </>
              ) : cooldown > 0 ? (
                <>
                  <Send className="size-4 text-muted-foreground" />
                  <span>Resend email in {cooldown}s</span>
                </>
              ) : (
                <>
                  <Send className="size-4 text-primary" />
                  <span>Resend verification email</span>
                </>
              )}
            </Button>

            {/* Check Status / Continue button */}
            <Button
              type="button"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full h-10 gap-2 font-semibold shadow-xs"
            >
              {isChecking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Checking status...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  <span>I&apos;ve verified my email — Continue</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-border/40 text-xs">
            <Link
              href="/login"
              className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <span>Already verified? Log in</span>
            </Link>

            {isAuthenticated ? (
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign Out</span>
                </Button>
              </form>
            ) : (
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Return to Home
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
