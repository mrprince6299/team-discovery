"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState } from "react"
import { login } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react"

export function LoginFormClient() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      const res = await login(formData)
      return res
    },
    undefined
  )

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
        <p className="text-xs text-muted-foreground">Sign in to find your hackathon teammates</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border-border/80 bg-card shadow-lg rounded-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-sm">
            Enter your college email and password to access your dashboard.
          </CardDescription>
        </CardHeader>

        <form action={formAction}>
          <CardContent className="space-y-4">
            {/* Error Message Display */}
            {state?.error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{state.error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5" />
                <span>Institutional Email</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="student@git.edu"
                className="h-10"
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">
                Use the verified email associated with your collegiate account.
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <Lock className="size-3.5" />
                <span>Password</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-10"
                disabled={isPending}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full h-10 gap-2 font-semibold shadow-xs"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-1 pt-1">
              <div>
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
                >
                  Create Account
                </Link>
              </div>
              <div>
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium"
                >
                  <ShieldCheck className="size-3" />
                  <span>Check Verification Status</span>
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
