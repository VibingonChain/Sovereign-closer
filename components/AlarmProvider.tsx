"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { GasStore, type GasSnapshot } from "@/lib/stores/gas-store";
import { VibeStore, type VibeSnapshot } from "@/lib/stores/vibe-store";
import { analyzeVibe } from "@/lib/services/vibe-engine";

type AlarmContextValue = {
  gasStore: GasStore;
  vibeStore: VibeStore;
};

const AlarmContext = createContext<AlarmContextValue | null>(null);

export function AlarmProvider({ children }: { children: ReactNode }) {
  const storesRef = useRef<AlarmContextValue | null>(null);

  if (storesRef.current === null) {
    storesRef.current = {
      gasStore: new GasStore(),
      vibeStore: new VibeStore({ analyzeVibe }),
    };
  }

  useEffect(() => {
    const { gasStore, vibeStore } = storesRef.current!;
    gasStore.start();
    vibeStore.start();

    return () => {
      gasStore.destroy();
      vibeStore.destroy();
      storesRef.current = null;
    };
  }, []);

  return (
    <AlarmContext.Provider value={storesRef.current}>
      {children}
    </AlarmContext.Provider>
  );
}

// --- Hooks ---

function useAlarm() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarm must be inside <AlarmProvider>");
  return ctx;
}

export function useGas(): GasSnapshot {
  const { gasStore } = useAlarm();
  return useSyncExternalStore(gasStore.subscribe, gasStore.getSnapshot, () => ({
    gasGwei: null,
    status: "DEGRADED" as const,
    lastUpdated: null,
    errorCount: 0,
  }));
}

export function useVibe(): VibeSnapshot {
  const { vibeStore } = useAlarm();
  return useSyncExternalStore(vibeStore.subscribe, vibeStore.getSnapshot, () => ({
    report: null,
    status: "DEGRADED" as const,
    lastUpdated: null,
    errorCount: 0,
  }));
}

export function useVibeStore(): VibeStore {
  return useAlarm().vibeStore;
}
