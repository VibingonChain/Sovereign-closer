"use client";

import { useState, useCallback, useEffect } from "react";
import type { ExecutionIntent } from "@/lib/schema/intent";
import { useSendTransaction, useAccount } from "wagmi";
import { toast } from "sonner";
import { fetchQuote, type Quote } from "@/lib/quote/quote";

const QUOTE_STALE_MS = 30_000;

export function TriggerModal({
  intent,
  onComplete,
  onDismiss,
}: {
  intent: ExecutionIntent;
  onComplete: (id: string, status: "DONE" | "FAILED", reason?: string) => void;
  onDismiss: () => void;
}) {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doQuote = useCallback(async () => {
    setQuoting(true);
    setError(null);
    try {
      const q = await fetchQuote(intent);
      setQuote(q);
    } catch (e: unknown) {
      setError(`Quote failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setQuoting(false);
    }
  }, [intent]);

  const doExecute = useCallback(async () => {
    if (!quote) return;

    // Staleness check
    if (Date.now() - quote.receivedAt > QUOTE_STALE_MS) {
      toast("Quote stale — re-quoting…");
      await doQuote();
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      const hash = await sendTransactionAsync({
        to: quote.to,
        data: quote.callData,
        value: quote.value,
      });

      toast.success(`Tx sent: ${hash.slice(0, 10)}…`);
      onComplete(intent.id, "DONE", `tx:${hash}`);
    } catch (e: unknown) {
      const msg = String(e instanceof Error ? e.message : e);
      let reason = "rpc_error";

      if (msg.includes("rejected") || msg.includes("denied")) {
        reason = "user_rejected";
      } else if (msg.includes("insufficient")) {
        reason = "insufficient_balance";
      } else if (msg.includes("slippage") || msg.includes("INSUFFICIENT_OUTPUT")) {
        reason = "slippage_exceeded";
      } else if (msg.includes("revert")) {
        reason = `revert:${msg.slice(0, 120)}`;
      }

      setError(reason);
      toast.error(`Execution failed: ${reason}`);
      onComplete(intent.id, "FAILED", reason);
    } finally {
      setExecuting(false);
    }
  }, [quote, intent, sendTransactionAsync, onComplete, doQuote]);

  // Auto-quote on mount
  useEffect(() => {
    doQuote();
  }, [doQuote]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
        <h2 className="text-sm font-semibold text-amber-400 font-mono uppercase tracking-widest">
          Triggered — Review & Execute
        </h2>

        <div className="text-xs font-mono text-white/60 space-y-1">
          <div>Asset: {intent.amount} → {intent.targetAsset}</div>
          <div>Trigger: {intent.triggerVibe}</div>
          <div>Max gas: {intent.maxGasGwei} gwei</div>
          <div>Max slippage: {intent.maxSlippageBps} bps</div>
        </div>

        {quote && (
          <div className="text-xs font-mono bg-white/5 rounded-xl p-3 space-y-1">
            <div>Est output: {quote.estOut}</div>
            <div>Min output: {quote.minOut}</div>
            <div>Router: {quote.router}</div>
            <div className="text-white/30">
              Quoted {((Date.now() - quote.receivedAt) / 1000).toFixed(0)}s ago
              {Date.now() - quote.receivedAt > QUOTE_STALE_MS && " (STALE — will re-quote)"}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs font-mono text-red-400 bg-red-400/10 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            disabled={executing}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-mono text-white/60 hover:text-white/80 transition-colors disabled:opacity-30"
          >
            Dismiss
          </button>
          <button
            onClick={quote ? doExecute : doQuote}
            disabled={quoting || executing}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-mono font-semibold hover:bg-amber-400 transition-colors disabled:opacity-30"
          >
            {quoting ? "Quoting…" : executing ? "Executing…" : quote ? "Execute" : "Get Quote"}
          </button>
        </div>
      </div>
    </div>
  );
}
