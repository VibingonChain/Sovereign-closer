"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlarmProvider,
  useGas,
  useVibe,
  useVibeStore,
} from "@/components/AlarmProvider";
import { evaluateIntents } from "@/lib/engine/agent";
import { loadIntents, saveIntents } from "@/lib/utils/storage";
import type { ExecutionIntent } from "@/lib/schema/intent";
import { ExecutionAgentBadge } from "@/components/ExecutionAgentBadge";
import { TriggerModal } from "@/components/TriggerModal";
import { IntentForm } from "@/components/IntentForm";
import { IntentList } from "@/components/IntentList";

function AlarmPageInner() {
  const [intents, setIntents] = useState<ExecutionIntent[]>(() => loadIntents());
  const [triggeredIntent, setTriggeredIntent] = useState<ExecutionIntent | null>(null);
  const triggerLockRef = useRef<Set<string>>(new Set());

  const gas = useGas();
  const vibe = useVibe();
  const vibeStore = useVibeStore();

  // Feed provider: for v1, textarea paste input
  const [feedText, setFeedText] = useState("");
  useEffect(() => {
    vibeStore.setFeedProvider(async () => feedText);
  }, [feedText, vibeStore]);

  // Evaluate loop: runs on every gas/vibe update
  useEffect(() => {
    const result = evaluateIntents({
      intents,
      gasGwei: gas.gasGwei,
      report: vibe.report,
    });

    if (result.changed) {
      setIntents(result.intents);
      saveIntents(result.intents); // ATOMIC: persist immediately on any status change
    }

    // Open modal for first triggered intent not already locked
    if (result.triggered.length > 0 && !triggeredIntent) {
      const first = result.triggered.find((t) => !triggerLockRef.current.has(t.id));
      if (first) {
        triggerLockRef.current.add(first.id);
        setTriggeredIntent(first);
      }
    }
  }, [gas.gasGwei, gas.lastUpdated, vibe.report, vibe.lastUpdated]);
  // NOTE: intents intentionally excluded from deps to prevent infinite loop.
  // State changes from evaluate are applied via setIntents; next gas/vibe
  // update will re-evaluate with the latest intents via closure.

  const handleIntentCreate = useCallback((intent: ExecutionIntent) => {
    setIntents((prev) => {
      const next = [...prev, intent];
      saveIntents(next);
      return next;
    });
  }, []);

  const handleIntentCancel = useCallback((id: string) => {
    setIntents((prev) => {
      const next = prev.map((i) =>
        i.id === id && i.status === "ARMED"
          ? { ...i, status: "CANCELLED" as const, reason: "user_cancelled" }
          : i
      );
      saveIntents(next);
      return next;
    });
  }, []);

  const handleExecutionComplete = useCallback(
    (id: string, status: "DONE" | "FAILED", reason?: string) => {
      setIntents((prev) => {
        const next = prev.map((i) =>
          i.id === id ? { ...i, status, reason: reason ?? i.reason } : i
        );
        saveIntents(next);
        return next;
      });
      setTriggeredIntent(null);
    },
    []
  );

  const handleModalDismiss = useCallback(() => {
    // If user dismisses without executing, revert to ARMED so it can re-trigger
    if (triggeredIntent) {
      triggerLockRef.current.delete(triggeredIntent.id);
      setIntents((prev) => {
        const next = prev.map((i) =>
          i.id === triggeredIntent.id && i.status === "TRIGGERED"
            ? { ...i, status: "ARMED" as const, reason: "user_dismissed_trigger" }
            : i
        );
        saveIntents(next);
        return next;
      });
    }
    setTriggeredIntent(null);
  }, [triggeredIntent]);

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">Closer — Alarm Mode</h1>

      <ExecutionAgentBadge />

      {/* Feed input (v1: paste) */}
      <div>
        <label className="block text-xs text-white/40 mb-1 font-mono uppercase tracking-widest">
          Feed Input (paste or type)
        </label>
        <textarea
          className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/80 font-mono resize-none focus:outline-none focus:border-white/30"
          value={feedText}
          onChange={(e) => setFeedText(e.target.value)}
          placeholder="Paste social feed, news, or signal text here…"
        />
      </div>

      <IntentForm onCreate={handleIntentCreate} />

      <IntentList
        intents={intents}
        gasGwei={gas.gasGwei}
        gasStatus={gas.status}
        vibeStatus={vibe.status}
        onCancel={handleIntentCancel}
      />

      {triggeredIntent && (
        <TriggerModal
          intent={triggeredIntent}
          onComplete={handleExecutionComplete}
          onDismiss={handleModalDismiss}
        />
      )}

      <footer className="text-[10px] text-white/30 text-center pt-8 font-mono">
        Alarm Mode runs only while this page is open. When a trigger hits,
        you&apos;ll get an alert and can review + execute with your wallet.
      </footer>
    </div>
  );
}

export default function AlarmPage() {
  return (
    <AlarmProvider>
      <AlarmPageInner />
    </AlarmProvider>
  );
}
