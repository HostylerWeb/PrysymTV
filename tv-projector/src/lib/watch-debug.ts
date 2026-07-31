/**
 * Watch playback timeline logger — filter logcat with:
 *   adb logcat -s ReactNativeJS:V | grep PRYSYM_WATCH
 */
export const WATCH_DEBUG_TAG = 'PRYSYM_WATCH';

/** Force-enabled for playback investigation — disable before production ship. */
export const WATCH_DEBUG_ENABLED = true;

let sessionId = '';
let sessionStartMs = 0;
let sequence = 0;

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function watchDebugReset(reason: string) {
  if (!WATCH_DEBUG_ENABLED) return;
  sessionId = `${Date.now()}`;
  sessionStartMs = Date.now();
  sequence = 0;
  watchDebug('session.start', { reason, sessionId });
}

export function watchDebug(event: string, data?: Record<string, unknown>) {
  if (!WATCH_DEBUG_ENABLED) return;
  if (!sessionStartMs) {
    sessionStartMs = Date.now();
    sessionId = `${sessionStartMs}`;
  }
  sequence += 1;
  const elapsedMs = Date.now() - sessionStartMs;
  const payload = safeJson({ sessionId, seq: sequence, elapsedMs, ...data });
  console.warn(`${WATCH_DEBUG_TAG} ${event} ${payload}`);
}

export function watchDebugUrl(url: string | null | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.slice(0, 80);
  }
}
