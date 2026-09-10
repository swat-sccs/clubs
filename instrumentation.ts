export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Build-time prerender workers also bootstrap the server; only a real
  // running server should touch the database.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { seedIfEmpty } = await import("./lib/seed");
    await seedIfEmpty();
    const { retryPendingImageDeletions } = await import(
      "./lib/storage-cleanup"
    );
    await retryPendingImageDeletions();
  } catch (error) {
    console.error("Startup seed check failed:", error);
  }
}
