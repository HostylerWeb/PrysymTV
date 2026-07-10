export type HlsVariant = {
  uri: string;
  height: number;
  label: string;
};

function labelForHeight(height: number): string {
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  if (height > 0) return `${height}p`;
  return 'Auto';
}

function resolvePlaylistUrl(masterUrl: string, line: string): string {
  if (line.startsWith('http://') || line.startsWith('https://')) return line;
  const base = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1);
  return `${base}${line}`;
}

/** Parse an HLS master playlist for manual quality switching. */
export async function fetchHlsVariants(masterUrl: string): Promise<HlsVariant[]> {
  if (!masterUrl.includes('.m3u8')) return [];
  try {
    const res = await fetch(masterUrl);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split('\n');
    const variants: HlsVariant[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]?.trim() ?? '';
      if (!line.startsWith('#EXT-X-STREAM-INF')) continue;
      const heightMatch = line.match(/RESOLUTION=\d+x(\d+)/i);
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;
      const uriLine = lines[i + 1]?.trim();
      if (!uriLine || uriLine.startsWith('#')) continue;
      variants.push({
        uri: resolvePlaylistUrl(masterUrl, uriLine),
        height,
        label: labelForHeight(height),
      });
    }
    return variants.sort((a, b) => b.height - a.height);
  } catch {
    return [];
  }
}
