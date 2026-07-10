import { getWsUrl } from '@/lib/api/config';

type PublisherMessage =
  | { type: 'ready' }
  | { type: 'connected' }
  | { type: 'error'; message: string };

function buildPublisherHtml(whipPublishUrl: string, publishing: boolean): string {
  const webOrigin = getWsUrl().replace(/\/$/, '');
  const pub = publishing ? 'true' : 'false';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
  video { width: 100%; height: 100%; object-fit: cover; background: #000; }
  #status { position: fixed; left: 12px; bottom: 12px; color: #fff; font: 12px sans-serif; opacity: 0.8; }
</style>
</head>
<body>
<video id="preview" autoplay playsinline muted></video>
<div id="status">Starting camera…</div>
<script src="${webOrigin}/mediamtx-publisher.js"></script>
<script>
const whipUrl = ${JSON.stringify(whipPublishUrl)};
let publishing = ${pub};
let publisher = null;
let stream = null;
const statusEl = document.getElementById('status');
const videoEl = document.getElementById('preview');

function post(msg) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
}

async function detectCodecs() {
  const pc = new RTCPeerConnection({});
  pc.addTransceiver('video', { direction: 'sendonly' });
  pc.addTransceiver('audio', { direction: 'sendonly' });
  const desc = await pc.createOffer();
  const sdp = (desc.sdp || '').toLowerCase();
  pc.close();
  const videoCodec = ['h264/90000', 'vp8/90000', 'vp9/90000'].find((c) => sdp.includes(c)) || 'vp8/90000';
  const audioCodec = ['opus/48000', 'pcmu/8000', 'pcma/8000'].find((c) => sdp.includes(c)) || 'opus/48000';
  return { videoCodec, audioCodec };
}

async function startPreview() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  });
  videoEl.srcObject = stream;
  videoEl.muted = true;
  await videoEl.play().catch(() => {});
  post({ type: 'ready' });
  statusEl.textContent = publishing ? 'Connecting…' : 'Preview ready';
  if (publishing) await startPublish();
}

async function startPublish() {
  if (!stream || !window.MediaMTXWebRTCPublisher) {
    post({ type: 'error', message: 'Publisher not loaded' });
    return;
  }
  const codecs = await detectCodecs();
  publisher = new window.MediaMTXWebRTCPublisher({
    url: whipUrl,
    stream,
    videoCodec: codecs.videoCodec,
    audioCodec: codecs.audioCodec,
    onConnected: () => {
      statusEl.textContent = 'Live';
      post({ type: 'connected' });
    },
    onError: (err) => {
      statusEl.textContent = err;
      post({ type: 'error', message: err });
    },
  });
}

function stopPublish() {
  try { publisher?.close(); } catch (_) {}
  publisher = null;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

window.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data || '{}');
    if (data.type === 'setPublishing') {
      publishing = !!data.value;
      if (publishing) void startPublish();
      else stopPublish();
    }
  } catch (_) {}
});

startPreview().catch((e) => post({ type: 'error', message: e?.message || 'Camera access denied' }));
</script>
</body>
</html>`;
}

type Props = {
  whipPublishUrl: string;
  publishing: boolean;
  onReady?: () => void;
  onConnected?: () => void;
  onError?: (message: string) => void;
};

export function buildLiveCameraPublisherSource(whipPublishUrl: string, publishing: boolean) {
  return { html: buildPublisherHtml(whipPublishUrl, publishing) };
}

export type { PublisherMessage };
