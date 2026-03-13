"use client";

import { useState, useCallback } from "react";
import type { ExecutionIntent } from "@/lib/schema/intent";
import type { VibeScore } from "@/lib/schema/report";
import { uid } from "@/lib/utils/uid";
import { hoursFromNow } from "@/lib/utils/time";

const VIBE_OPTIONS: VibeScore[] = [
  "CAPITULATION",
  "BEARISH",
  "NEUTRAL",
  "BULLISH",
  "GENUINE_ACCUMULATION",
];

const ASSET_OPTIONS = ["USDC", "ETH"] as const;

export function IntentForm({
  onCreate,
}: {
  onCreate: (intent: ExecutionIntent) => void;
}) {
  const [targetAsset, setTargetAsset] = useState<"USDC" | "ETH">("USDC");
  const [amount, setAmount] = useState("100");
  const [maxSlippageBps, setMaxSlippageBps] = useState(50);
  const [triggerVibe, setTriggerVibe] = useState<VibeScore>("CAPITULATION");
  const [maxGasGwei, setMaxGasGwei] = useState(0.03);
  const [expiryHours, setExpiryHours] = useState(24);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const intent: ExecutionIntent = {
        id: uid(),
        chainId: 1,
        createdAt: Date.now(),
        expiresAt: hoursFromNow(expiryHours),
        targetAsset,
        amount,
        maxSlippageBps,
        triggerVibe,
        maxGasGwei,
        status: "ARMED",
      };

      onCreate(intent);
    },
    [targetAsset, amount, maxSlippageBps, triggerVibe, maxGasGwei, expiryHours, onCreate]
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
      <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40">
        New Intent
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Asset</label>
          <select
            value={targetAsset}
            onChange={(e) => setTargetAsset(e.target.value as "USDC" | "ETH")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
          >
            {ASSET_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Trigger Vibe</label>
          <select
            value={triggerVibe}
            onChange={(e) => setTriggerVibe(e.target.value as VibeScore)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
          >
            {VIBE_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Max Gas (gwei)</label>
          <input
            type="number"
            value={maxGasGwei}
            onChange={(e) => setMaxGasGwei(Number(e.target.value))}
            min={0.01}
            max={0.05}
            step={0.005}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Slippage (bps)</label>
          <input
            type="number"
            value={maxSlippageBps}
            onChange={(e) => setMaxSlippageBps(Number(e.target.value))}
            min={1}
            max={500}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-white/40 mb-1">Expires in (hours)</label>
          <input
            type="number"
            value={expiryHours}
            onChange={(e) => setExpiryHours(Number(e.target.value))}
            min={1}
            max={168}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 font-mono focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-xs font-mono font-semibold hover:bg-blue-400 transition-colors"
      >
        Arm Intent
      </button>
    </form>
  );
}
