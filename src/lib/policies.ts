/**
 * Beta Policy Configuration:
 * During the open testing/beta phase, institutional verification requirement
 * is temporarily bypassed to allow immediate access to core platform features
 * (team creation, applications, invitations, discovery) for all authenticated users.
 * 
 * To re-enable strict verification later:
 * Change REQUIRE_INSTITUTIONAL_VERIFICATION to true.
 */
export const REQUIRE_INSTITUTIONAL_VERIFICATION = false

/**
 * Checks whether a user satisfies the verification and active account policy for core platform actions.
 * Suspended users are unconditionally locked out of mutations and core platform features.
 * In Beta mode (REQUIRE_INSTITUTIONAL_VERIFICATION === false), any active (non-suspended) authenticated user passes.
 * In Production strict mode, requires user.verificationStatus === 'APPROVED' and isSuspended !== true.
 */
export function isUserEligibleForCoreFeatures(
  verificationStatus?: string | null,
  isSuspended?: boolean | null
): boolean {
  if (isSuspended) {
    return false
  }
  if (!REQUIRE_INSTITUTIONAL_VERIFICATION) {
    return true
  }
  return verificationStatus === 'APPROVED'
}

/**
 * Checks whether an account is active (not suspended).
 */
export function isUserAccountActive(user?: { isSuspended?: boolean | null } | null): boolean {
  return !user?.isSuspended
}
