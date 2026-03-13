"use client";

import type { ExecutionIntent } from "@/lib/schema/intent";
import type { GasStatus } from "@/lib/stores/gas-store";
import type { VibeStatus } from "@/lib/stores/vibe-store";

const REASON_LABELS: Record<string, string> = {
  waiting_vibe: "Waiting for vibe match",
  waiting_gas: "Waiting for gas to drop",
  gas_unavailable: "Gas data unavailable",
  vibe_unavailable: "Vibe data unavailable",
  conditions_met: "Conditions met — triggered",
  expired: "Expired",
  user_cancelled: "Cancelled",
  user_dismissed_trigger: "Trigger dismissed — re-armed",
};

const STATUS_COLORS: Record<string, string> = {
  ARMED: "text-blue-400",
  TRIGGERED: "text-amber-400",
  EXECUTING: "text-purple-400",
  DONE: "text-green-400",
  FAILED: "text-red-400",
  CANCELLED: "text-white/30",
  EXPIRED: "text-white/30",
  DRAFT: "text-white/20",
};

export function IntentList({
  intents,
  gasGwei,
  gasStatus,
  vibeStatus,
  onCancel,
}: {
  intents: ExecutionIntent[];
  gasGwei: number | null;
  gasStatus: GasStatus;
  vibeStatus: VibeStatus;
  onCancel: (id: string) => void;
}) {
  if (intents.length === 0) {
    return (
      <div className="text-sm text-white/30 text-center py-8">
        No intents yet. Create one above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {intents.map((intent) => (
        <div
          key={intent.id}
          className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-semibold ${STATUS_COLORS[intent.status] ?? "text-white/40"}`}>
                {intent.status}
              </span>
              <span className="text-xs text-white/60">
                {intent.amount} {intent.targetAsset}
              </span>
            </div>
            {intent.status === "ARMED" && (
              <button
                onClick={() => onCancel(intent.id)}
                className="text-[10px] font-mono text-red-400/60 hover:text-red-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="text-[10px] font-mono text-white/40 space-y-0.5">
            <div>
              Trigger: {intent.triggerVibe} · Max gas: {intent.maxGasGwei} gwei ·
              Slippage: {intent.maxSlippageBps}bps
            </div>
            <div>
              Expires: {new Date(intent.expiresAt).toLocaleString()}
            </div>
            {intent.reason && (
              <div className="text-white/50">
                → {REASON_LABELS[intent.reason] ?? intent.reason}
                {intent.reason === "waiting_gas" && gasGwei != null && (
                  <span> (current: {gasGwei.toFixed(3)} gwei, need ≤{intent.maxGasGwei})</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
