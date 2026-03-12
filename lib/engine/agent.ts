import {
  type ExecutionIntent,
  TERMINAL_STATUSES,
} from "@/lib/schema/intent";
import type { VibeReport } from "@/lib/schema/report";

export type EvalResult = {
  intents: ExecutionIntent[];
  changed: boolean;
  triggered: ExecutionIntent[];
};

export function evaluateIntents(params: {
  intents: ExecutionIntent[];
  gasGwei: number | null;
  report: VibeReport | null;
  now?: number;
}): EvalResult {
  const now = params.now ?? Date.now();
  const { intents, gasGwei, report } = params;

  let changed = false;
  const triggered: ExecutionIntent[] = [];

  const updated = intents.map((i) => {
    // Skip terminal or already-triggered intents
    if (TERMINAL_STATUSES.includes(i.status) || i.status !== "ARMED") {
      return i;
    }

    // Expiry check
    if (now > i.expiresAt) {
      changed = true;
      return { ...i, status: "EXPIRED" as const, reason: "expired" };
    }

    // Need both signals to evaluate
    if (gasGwei == null) {
      return { ...i, reason: "gas_unavailable" };
    }
    if (!report) {
      return { ...i, reason: "vibe_unavailable" };
    }

    const vibeMatch = report.score === i.triggerVibe;
    const gasMatch = gasGwei <= i.maxGasGwei;

    if (vibeMatch && gasMatch) {
      changed = true;
      const t = { ...i, status: "TRIGGERED" as const, reason: "conditions_met" };
      triggered.push(t);
      return t;
    }

    // Informational reason (not a status change, so no persist needed)
    const reason = !vibeMatch ? "waiting_vibe" : "waiting_gas";
    if (i.reason !== reason) {
      changed = true;
      return { ...i, reason };
    }
    return i;
  });

  return { intents: updated, changed, triggered };
}
