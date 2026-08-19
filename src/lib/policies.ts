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
 * Checks whether a user satisfies the verification policy for core platform actions.
 * In Beta mode (REQUIRE_INSTITUTIONAL_VERIFICATION === false), any authenticated user passes.
 * In Production strict mode, requires user.verificationStatus === 'APPROVED'.
 */
export function isUserEligibleForCoreFeatures(verificationStatus?: string | null): boolean {
  if (!REQUIRE_INSTITUTIONAL_VERIFICATION) {
    return true
  }
  return verificationStatus === 'APPROVED'
}
