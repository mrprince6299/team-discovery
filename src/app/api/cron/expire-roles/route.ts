import { NextRequest, NextResponse } from 'next/server'
import { expireOverdueRoles } from '@/app/actions/roles'

/**
 * Production-Safe Scheduled Cron Endpoint for Overdue Role Expiry.
 * Invoked by Vercel Cron, GitHub Actions, or cloud schedulers.
 *
 * Security:
 * Protected via bearer token or custom header against `process.env.CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}

async function handleCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  // 1. In production, CRON_SECRET must be configured
  if (process.env.NODE_ENV === 'production' && !cronSecret) {
    console.error('[CRON /api/cron/expire-roles] CRON_SECRET environment variable is missing in production.')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  // 2. Validate Authorization
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const customHeader = request.headers.get('x-cron-secret')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    const tokenProvided = bearerToken || customHeader
    if (!tokenProvided || tokenProvided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing cron authorization.' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV !== 'test') {
    // If not in test mode and no cron secret configured, reject
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // 3. Execute Idempotent Expiry Business Logic
  try {
    const result = await expireOverdueRoles()
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expiredCount: result.expiredCount ?? 0,
    })
  } catch (error: any) {
    console.error('[CRON /api/cron/expire-roles] Execution error:', error?.message || error)
    return NextResponse.json({ error: 'Internal server error during cron execution.' }, { status: 500 })
  }
}
