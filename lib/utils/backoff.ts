export function nextDelayMs(
  baseMs: number,
  errorCount: number,
  maxMs: number
): number {
  const pow = Math.min(errorCount, 6);
  const raw = baseMs * Math.pow(2, pow);
  const jitter = raw * (0.9 + Math.random() * 0.2);
  return Math.min(Math.floor(jitter), maxMs);
}
