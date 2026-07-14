import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useImmersiveSystemUi } from '@/hooks/useImmersiveSystemUi';

type ImmersivePlaybackContextValue = {
  immersive: boolean;
  enterImmersive: () => void;
  exitImmersive: () => void;
};

const ImmersivePlaybackContext = createContext<ImmersivePlaybackContextValue | null>(null);

export function ImmersivePlaybackProvider({ children }: { children: React.ReactNode }) {
  const [depth, setDepth] = useState(0);

  const enterImmersive = useCallback(() => {
    setDepth((value) => value + 1);
  }, []);

  const exitImmersive = useCallback(() => {
    setDepth((value) => Math.max(0, value - 1));
  }, []);

  const immersive = depth > 0;
  useImmersiveSystemUi(immersive);

  const value = useMemo(
    () => ({
      immersive,
      enterImmersive,
      exitImmersive,
    }),
    [immersive, enterImmersive, exitImmersive],
  );

  return (
    <ImmersivePlaybackContext.Provider value={value}>{children}</ImmersivePlaybackContext.Provider>
  );
}

export function useImmersivePlayback() {
  const context = useContext(ImmersivePlaybackContext);
  if (!context) {
    throw new Error('useImmersivePlayback must be used within ImmersivePlaybackProvider');
  }
  return context;
}

/** Hide the global status bar while a player is fullscreen or otherwise immersive. */
export function useImmersivePlaybackRegistration(active: boolean) {
  const { enterImmersive, exitImmersive } = useImmersivePlayback();

  React.useEffect(() => {
    if (!active) return;
    enterImmersive();
    return () => exitImmersive();
  }, [active, enterImmersive, exitImmersive]);
}
