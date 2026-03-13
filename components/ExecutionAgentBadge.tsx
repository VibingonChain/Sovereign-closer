"use client";

import { useGas, useVibe } from "@/components/AlarmProvider";

export function ExecutionAgentBadge() {
  const gas = useGas();
  const vibe = useVibe();

  const gasOk = gas.status === "OK";
  const vibeOk = vibe.status === "OK";
  const allOk = gasOk && vibeOk;

  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
      <div
        className={`w-2 h-2 rounded-full ${
          allOk ? "bg-green-500 animate-pulse" : "bg-yellow-500"
        }`}
      />
      <div className="flex-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
          {allOk ? "Agent online" : "Agent degraded (retrying…)"}
        </span>
        {!allOk && (
          <div className="text-[9px] font-mono text-white/30 mt-0.5">
            {!gasOk && `Gas: ${gas.lastError ?? "unavailable"} (retry #${gas.errorCount})`}
            {!gasOk && !vibeOk && " · "}
            {!vibeOk && `Vibe: ${vibe.lastError ?? "unavailable"} (retry #${vibe.errorCount})`}
          </div>
        )}
        {gasOk && gas.gasGwei != null && (
          <div className="text-[9px] font-mono text-white/30 mt-0.5">
            Gas Regime: {gas.regime} ({gas.gasGwei.toFixed(3)} Gwei)
          </div>
        )}
      </div>
    </div>
  );
}
