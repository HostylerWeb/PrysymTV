/** Skip unlocks after this fraction of the ad video has played. */
export const AD_SKIP_DURATION_FRACTION = 0.5;

export const POST_END_SKIP_MS = 3000;

export function videoAdSkipSecondsRemaining(
  currentTime: number,
  duration: number,
): number {
  if (duration <= 0) return 0;
  const skipAt = duration * AD_SKIP_DURATION_FRACTION;
  return Math.max(0, Math.ceil(skipAt - currentTime));
}

export function canSkipVideoAd(
  mediaReady: boolean,
  currentTime: number,
  duration: number,
  skippable = false,
): boolean {
  if (!mediaReady) return false;
  if (skippable) return true;
  if (duration <= 0) return false;
  return currentTime >= duration * AD_SKIP_DURATION_FRACTION;
}

export function canSkipImageAd(mediaReady: boolean, countdown: number): boolean {
  return mediaReady && countdown <= 0;
}
