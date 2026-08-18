"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState } from "react"
import { signup } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRight, CheckCircle2, Info, Loader2, Lock, Mail, User } from "lucide-react"

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { error?: string } | undefined, formData: FormData) => {
      const res = await signup(formData)
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
        <p className="text-xs text-muted-foreground">Register your collegiate account</p>
      </div>

      {/* Signup Card */}
      <Card className="w-full max-w-md border-border/80 bg-card shadow-lg rounded-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-sm">
            Join the platform to discover teammates with matching skills.
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

            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <User className="size-3.5" />
                <span>Full Name</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Alex Morgan"
                className="h-10"
                disabled={isPending}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
              >
                <Mail className="size-3.5" />
                <span>College / Institutional Email</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="alex.m@college.edu"
                className="h-10"
                disabled={isPending}
              />
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                <Info className="size-3.5 shrink-0 text-blue-500 mt-0.5" />
                <span>
                  Please use your official university or collegiate email. Email is immutable after verification.
                </span>
              </div>
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
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="••••••••"
                className="h-10"
                disabled={isPending}
              />
              <p className="text-[11px] text-muted-foreground">Minimum 6 characters.</p>
            </div>

            {/* Feature Highlights */}
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>What happens next?</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                After signing up, you will land on the verification check screen while your student profile is initiated.
              </p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Sign In
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
