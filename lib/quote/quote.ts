import type { ExecutionIntent } from "@/lib/schema/intent";

export type Quote = {
  receivedAt: number;
  estOut: string;
  minOut: string;
  router: string;
  callData: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
};

export async function fetchQuote(intent: ExecutionIntent): Promise<Quote> {
  // TODO: wire to your DEX aggregator (Uniswap v3 / 0x / 1inch)
  // This is the integration point — returns calldata for the swap
  throw new Error("implement: fetchQuote for your chosen router");
}
