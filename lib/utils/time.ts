// Time utilities for intent expiry and display
export function hoursFromNow(hours: number): number {
  return Date.now() + hours * 60 * 60 * 1000;
}

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}
