import { z } from "zod";
import { VibeScoreSchema } from "./report";

export const IntentStatusSchema = z.enum([
  "DRAFT",
  "ARMED",
  "TRIGGERED",
  "EXECUTING",
  "DONE",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

export type IntentStatus = z.infer<typeof IntentStatusSchema>;

// Terminal states — once here, no further transitions
export const TERMINAL_STATUSES: IntentStatus[] = ["DONE", "FAILED", "CANCELLED", "EXPIRED"];

export const ExecutionIntentSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  createdAt: z.number(),
  expiresAt: z.number(),

  targetAsset: z.enum(["USDC", "ETH"]),
  amount: z.string(),
  maxSlippageBps: z.number().min(1).max(500),

  triggerVibe: VibeScoreSchema,
  maxGasGwei: z.number().positive(),

  status: IntentStatusSchema,
  reason: z.string().optional(),

  quote: z
    .object({
      receivedAt: z.number(),
      minOut: z.string().optional(),
      estOut: z.string().optional(),
      router: z.string().optional(),
    })
    .optional(),
});

export type ExecutionIntent = z.infer<typeof ExecutionIntentSchema>;
