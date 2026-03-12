import { createPublicClient, formatGwei, http } from "viem";
import { mainnet } from "viem/chains";
import { nextDelayMs } from "@/lib/utils/backoff";

export type GasStatus = "OK" | "DEGRADED";

export type GasSnapshot = {
  gasGwei: number | null;
  status: GasStatus;
  lastUpdated: number | null;
  errorCount: number;
  lastError?: string;
};

const INITIAL: GasSnapshot = {
  gasGwei: null,
  status: "DEGRADED",
  lastUpdated: null,
  errorCount: 0,
};

export class GasStore {
  private snapshot: GasSnapshot = { ...INITIAL };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private client;

  private readonly BASE_MS = 45_000;
  private readonly MAX_MS = 10 * 60_000;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl ?? process.env.NEXT_PUBLIC_RPC_URL),
    });
  }

  getSnapshot = (): GasSnapshot => this.snapshot;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  private emit() {
    this.listeners.forEach((fn) => {
      try { fn(); } catch { /* don't kill the loop */ }
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

  private async tick() {
    if (this.destroyed) return;

    try {
      const gas = await this.client.getGasPrice();
      const gasGwei = Number(formatGwei(gas));

      this.snapshot = {
        gasGwei,
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
