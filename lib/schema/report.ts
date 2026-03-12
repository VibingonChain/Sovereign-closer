import { z } from "zod";

export const VibeScoreSchema = z.enum([
  "CAPITULATION",
  "BEARISH",
  "NEUTRAL",
  "BULLISH",
  "GENUINE_ACCUMULATION",
]);

export const VibeReportSchema = z.object({
  score: VibeScoreSchema,
  confidence: z.number().min(0).max(100),
  networkRegime: z.enum(["GHOST_TOWN", "HEALTHY", "CONGESTED", "UNKNOWN"]),
  timestamp: z.number(),
});

export type VibeReport = z.infer<typeof VibeReportSchema>;
export type VibeScore = z.infer<typeof VibeScoreSchema>;
