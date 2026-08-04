import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PodcastEpisode } from '@/types/api';

type PodcastPlayerState = {
  episode: PodcastEpisode | null;
  playing: boolean;
  progress: number;
  muted: boolean;
};

type PodcastPlayerContextValue = PodcastPlayerState & {
  playEpisode: (episode: PodcastEpisode) => void;
  togglePlay: () => void;
  toggleMute: () => void;
  stop: () => void;
  setProgress: (progress: number) => void;
};

const PodcastPlayerContext = createContext<PodcastPlayerContextValue | null>(null);

export function PodcastPlayerProvider({ children }: { children: React.ReactNode }) {
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);

  const playEpisode = useCallback((ep: PodcastEpisode) => {
    setEpisode((prev) => {
      if (prev?.id === ep.id) return prev;
      setProgress(0);
      return ep;
    });
    setPlaying(true);
  }, []);

  const togglePlay = useCallback(() => setPlaying((p) => !p), []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const stop = useCallback(() => {
    setEpisode(null);
    setPlaying(false);
    setProgress(0);
  }, []);

  const value = useMemo(
    () => ({
      episode,
      playing,
      progress,
      muted,
      playEpisode,
      togglePlay,
      toggleMute,
      stop,
      setProgress,
    }),
    [episode, playing, progress, muted, playEpisode, togglePlay, toggleMute, stop],
  );

  return <PodcastPlayerContext.Provider value={value}>{children}</PodcastPlayerContext.Provider>;
}

export function usePodcastPlayer() {
  const ctx = useContext(PodcastPlayerContext);
  if (!ctx) throw new Error('usePodcastPlayer must be used within PodcastPlayerProvider');
  return ctx;
}
