import { execFile } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type MediaProbe = {
  durationSeconds: number;
  width: number;
  height: number;
  hasVideo: boolean;
  hasAudio: boolean;
  isAudioOnly: boolean;
};

type FfprobeStream = {
  codec_type?: string;
  width?: number;
  height?: number;
};

type FfprobeJson = {
  format?: { duration?: string };
  streams?: FfprobeStream[];
};

export async function probeMedia(
  inputPath: string,
  ffprobePath: string,
): Promise<MediaProbe> {
  const { stdout } = await execFileAsync(
    ffprobePath,
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-show_entries',
      'stream=codec_type,width,height',
      '-of',
      'json',
      inputPath,
    ],
    { maxBuffer: 2 * 1024 * 1024 },
  );

  const parsed = JSON.parse(stdout) as FfprobeJson;
  const streams = parsed.streams ?? [];
  const videoStream = streams.find((s) => s.codec_type === 'video');
  const hasAudio = streams.some((s) => s.codec_type === 'audio');
  const hasVideo = Boolean(videoStream);
  const durationSeconds = Math.max(
    0,
    Math.round(Number(parsed.format?.duration ?? 0)),
  );

  return {
    durationSeconds,
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    hasVideo,
    hasAudio,
    isAudioOnly: hasAudio && !hasVideo,
  };
}

/** Ladder heights capped by source (no upscale). */
export function pickTranscodeHeights(sourceHeight: number): number[] {
  const candidates = [360, 480, 720, 1080];
  const cap = sourceHeight > 0 ? sourceHeight : 720;
  const picked = candidates.filter((h) => h <= cap);
  return picked.length > 0 ? picked : [Math.min(360, cap)];
}

/**
 * Produces HLS VOD with master.m3u8 and stream_%v folders (multi-bitrate when video).
 * Audio-only inputs get a single AAC HLS stream.
 */
export async function transcodeToHls(
  inputPath: string,
  outputDir: string,
  ffmpegPath: string,
  ffprobePath: string,
): Promise<MediaProbe> {
  const probe = await probeMedia(inputPath, ffprobePath);

  if (probe.isAudioOnly) {
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i',
      inputPath,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-hls_time',
      '6',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      join(outputDir, 'seg_%03d.ts'),
      '-f',
      'hls',
      join(outputDir, 'master.m3u8'),
    ]);
    return probe;
  }

  const heights = pickTranscodeHeights(probe.height);
  const n = heights.length;

  if (n === 1) {
    const h = heights[0];
    const args = [
      '-y',
      '-i',
      inputPath,
      '-vf',
      `scale=-2:${h}`,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-hls_time',
      '6',
      '-hls_playlist_type',
      'vod',
      '-hls_segment_filename',
      join(outputDir, 'stream_0/seg_%03d.ts'),
      '-f',
      'hls',
      join(outputDir, 'master.m3u8'),
    ];
    await execFileAsync(ffmpegPath, args, { maxBuffer: 8 * 1024 * 1024 });
    return probe;
  }

  const filterParts: string[] = [];
  const splitLabels = heights.map((_, i) => `[v${i}]`).join('');
  filterParts.push(`[0:v]split=${n}${splitLabels}`);
  heights.forEach((h, i) => {
    filterParts.push(`[v${i}]scale=-2:${h}[out${i}]`);
  });
  const filterComplex = filterParts.join(';');

  const args: string[] = ['-y', '-i', inputPath, '-filter_complex', filterComplex];

  const bitrates = ['800k', '2500k', '5000k', '8000k'];
  for (let i = 0; i < n; i++) {
    args.push('-map', `[out${i}]`);
    if (probe.hasAudio) args.push('-map', '0:a:0');
    args.push(`-c:v:${i}`, 'libx264', `-preset`, 'veryfast', `-crf`, '23');
    args.push(`-b:v:${i}`, bitrates[Math.min(i, bitrates.length - 1)]);
    if (probe.hasAudio) {
      args.push(`-c:a:${i}`, 'aac', `-b:a:${i}`, '128k');
    }
  }

  const varStreamParts: string[] = [];
  for (let i = 0; i < n; i++) {
    varStreamParts.push(probe.hasAudio ? `v:${i},a:${i}` : `v:${i}`);
  }

  args.push(
    '-f',
    'hls',
    '-hls_time',
    '6',
    '-hls_playlist_type',
    'vod',
    '-master_pl_name',
    'master.m3u8',
    '-var_stream_map',
    varStreamParts.join(' '),
    '-hls_segment_filename',
    join(outputDir, 'stream_%v/seg_%03d.ts'),
    join(outputDir, 'master.m3u8'),
  );

  await execFileAsync(ffmpegPath, args, { maxBuffer: 16 * 1024 * 1024 });
  return probe;
}

export async function extractThumbnail(
  inputPath: string,
  thumbPath: string,
  ffmpegPath: string,
  hasVideo: boolean,
): Promise<void> {
  if (!hasVideo) return;
  await execFileAsync(ffmpegPath, [
    '-y',
    '-ss',
    '00:00:02',
    '-i',
    inputPath,
    '-vframes',
    '1',
    '-q:v',
    '2',
    thumbPath,
  ]);
}

export async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

export function contentTypeForHlsFile(fileName: string): string {
  if (fileName.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (fileName.endsWith('.ts')) return 'video/mp2t';
  return 'application/octet-stream';
}

export async function uploadHlsDirectory(
  localHlsDir: string,
  storagePrefix: string,
  uploadFn: (key: string, localPath: string, contentType: string) => Promise<void>,
): Promise<void> {
  const files = await listFilesRecursive(localHlsDir);
  for (const absPath of files) {
    const rel = absPath.slice(localHlsDir.length + 1).replace(/\\/g, '/');
    const key = `${storagePrefix}/${rel}`;
    const st = await stat(absPath);
    if (!st.isFile()) continue;
    await uploadFn(key, absPath, contentTypeForHlsFile(rel));
  }
}
