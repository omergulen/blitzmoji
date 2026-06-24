/** Fire-and-forget anonymous interaction ping. Never throws, never blocks UI. */
export function track(id: string, kind: "copy" | "download"): void {
  try {
    const body = JSON.stringify({ id, kind });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/event", { method: "POST", body, keepalive: true });
    }
  } catch {
    /* ignore */
  }
}
