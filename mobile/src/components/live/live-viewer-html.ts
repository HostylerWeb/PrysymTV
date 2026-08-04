import { getWsUrl } from '@/lib/api/config';

export type LiveViewerMessage =
  | { type: 'ready' }
  | { type: 'playing' }
  | { type: 'error'; message: string };

export function buildLiveViewerHtml(whepPlaybackUrl: string): string {
  const webOrigin = getWsUrl().replace(/\/$/, '');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
</style>
</head>
<body>
<video id="player" autoplay playsinline></video>
<script src="${webOrigin}/mediamtx-reader.js"></script>
<script>
const whepUrl = ${JSON.stringify(whepPlaybackUrl)};
let reader = null;
let paused = false;
const videoEl = document.getElementById('player');

function post(msg) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

function stopReader() {
  if (reader) {
    reader.close();
    reader = null;
  }
  if (videoEl) videoEl.srcObject = null;
}

function startReader() {
  stopReader();
  if (!whepUrl || !window.MediaMTXWebRTCReader) {
    post({ type: 'error', message: 'WebRTC reader unavailable' });
    return;
  }
  reader = new window.MediaMTXWebRTCReader({
    url: whepUrl,
    onTrack: (evt) => {
      const stream = evt.streams[0];
      if (!stream || paused) return;
      videoEl.srcObject = stream;
      videoEl.play().then(() => post({ type: 'playing' })).catch(() => {});
    },
    onError: (err) => post({ type: 'error', message: String(err || 'WebRTC playback failed') }),
  });
  post({ type: 'ready' });
}

function onControlMessage(raw) {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    if (data.type === 'setPaused') {
      paused = !!data.value;
      if (paused) videoEl.pause();
      else videoEl.play().catch(() => {});
    }
  } catch (_) {}
}

window.addEventListener('message', (event) => onControlMessage(event.data));
document.addEventListener('message', (event) => onControlMessage(event.data));

let bootAttempts = 0;
function boot() {
  bootAttempts += 1;
  if (window.MediaMTXWebRTCReader) {
    startReader();
    return;
  }
  if (bootAttempts > 100) {
    post({ type: 'error', message: 'WebRTC reader script failed to load' });
    return;
  }
  setTimeout(boot, 50);
}
boot();
</script>
</body>
</html>`;
}
