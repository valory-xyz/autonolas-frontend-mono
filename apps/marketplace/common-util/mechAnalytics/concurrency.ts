// Simple concurrency-limited map. Preserves input order in the result.
// Shared between the /api/services requester-metrics fan-out and the
// /api/service-activity per-multisig / per-mech fan-out — both are
// reachable from client-driven surfaces where the fan-out size can
// grow unbounded (services by serviceIds list, activity by historical
// multisig union + service mechs).
export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    let i = next;
    next += 1;
    while (i < items.length) {
      results[i] = await fn(items[i], i);
      i = next;
      next += 1;
    }
  };
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
};
