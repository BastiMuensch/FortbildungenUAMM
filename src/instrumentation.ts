/**
 * Wird von Next.js einmal beim Serverstart ausgeführt.
 * Siehe node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
 */
export async function register() {
  // Nur im Node-Prozess, nicht in der Edge-Runtime.
  // Der positive Runtime-Zweig erlaubt Next.js, Node-Module bereits beim
  // Bündeln der Edge-Instrumentierung vollständig auszuschließen.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startRetentionScheduler } = await import("@/lib/scheduler");
    startRetentionScheduler();
    const { starteDatensicherungsScheduler } = await import("@/lib/datensicherung");
    starteDatensicherungsScheduler();
  }
}
