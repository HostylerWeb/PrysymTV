/** True when the user has an active Platform Insider subscription. */
export function isInsiderActive(
  insiderActive: boolean | undefined | null,
  insiderPeriodEnd: string | null | undefined,
): boolean {
  if (insiderActive) return true;
  if (!insiderPeriodEnd) return false;
  return new Date(insiderPeriodEnd).getTime() > Date.now();
}
