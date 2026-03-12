import {
  ExecutionIntentSchema,
  type ExecutionIntent,
} from "@/lib/schema/intent";

const KEY = "vibe-closer:intents:v1";

export function loadIntents(): ExecutionIntent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x: unknown) => ExecutionIntentSchema.safeParse(x))
      .filter((r) => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

export function saveIntents(intents: ExecutionIntent[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(intents));
}
