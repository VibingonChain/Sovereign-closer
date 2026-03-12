import { VibeReportSchema, type VibeReport } from "@/lib/schema/report";
import { nextDelayMs } from "@/lib/utils/backoff";

export type VibeStatus = "OK" | "DEGRADED";

export type VibeSnapshot = {
  report: VibeReport | null;
  status: VibeStatus;
  lastUpdated: number | null;
  errorCount: number;
  lastError?: string;
};

const INITIAL: VibeSnapshot = {
  report: null,
  status: "DEGRADED",
  lastUpdated: null,
  errorCount: 0,
};

export class VibeStore {
  private snapshot: VibeSnapshot = { ...INITIAL };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  private readonly BASE_MS = 60_000;
  private readonly MAX_MS = 10 * 60_000;
  private readonly TIMEOUT_MS = 10_000;

  private feedProvider: (() => Promise<string>) | null = null;
  private analyzeVibe: ((feed: string) => Promise<VibeReport>) | null = null;

  constructor(deps: {
    analyzeVibe: (feed: string) => Promise<VibeReport>;
  }) {
    this.analyzeVibe = deps.analyzeVibe;
  }

  setFeedProvider(fn: () => Promise<string>) {
    this.feedProvider = fn;
  }

  getSnapshot = (): VibeSnapshot => this.snapshot;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  private emit() {
    this.listeners.forEach((fn) => {
      try { fn(); } catch { /* safe */ }
    });
  }

  start() {
    if (this.destroyed) return;
    this.tick();
  }

  destroy() {
    this.destroyed = true;
    if (this.timer) clearTimeout(this.timer);
    this.listeners.clear();
  }

  private timeout<T>(ms: number): Promise<T> {
    return new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("vibe_timeout")), ms)
    );
  }

  private async tick() {
    if (this.destroyed) return;

    try {
      if (!this.feedProvider) throw new Error("no_feed_provider");
      if (!this.analyzeVibe) throw new Error("no_analyze_fn");

      const feed = await Promise.race([
        this.feedProvider(),
        this.timeout<string>(this.TIMEOUT_MS),
      ]);

      const raw = await this.analyzeVibe(feed);

      // VALIDATE: analyzeVibe must return a conforming VibeReport
      const report = VibeReportSchema.parse(raw);

      this.snapshot = {
        report,
        status: "OK",
        lastUpdated: Date.now(),
        errorCount: 0,
      };
      this.emit();
      this.timer = setTimeout(() => this.tick(), this.BASE_MS);
    } catch (e: unknown) {
      const errorCount = this.snapshot.errorCount + 1;
      this.snapshot = {
        ...this.snapshot,
        status: "DEGRADED",
        errorCount,
        lastError: String(e instanceof Error ? e.message : e),
      };
      this.emit();

      const delay = nextDelayMs(this.BASE_MS, errorCount, this.MAX_MS);
      this.timer = setTimeout(() => this.tick(), delay);
    }
  }
}
