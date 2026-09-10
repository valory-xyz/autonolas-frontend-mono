import { mapWithConcurrency } from 'common-util/mechAnalytics/concurrency';

describe('mapWithConcurrency', () => {
  it('preserves input order in the result', async () => {
    const items = [10, 20, 30, 40, 50];
    const result = await mapWithConcurrency(items, 2, async (n) => n * 2);
    expect(result).toEqual([20, 40, 60, 80, 100]);
  });

  it('respects the concurrency bound', async () => {
    let inFlight = 0;
    let peak = 0;
    const barrier: (() => void)[] = [];
    const items = Array.from({ length: 10 }, (_, i) => i);
    const task = (i: number) =>
      new Promise<number>((resolve) => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        barrier.push(() => {
          inFlight -= 1;
          resolve(i);
        });
      });

    const done = mapWithConcurrency(items, 3, task);
    // Let the workers pick up their first tasks.
    await new Promise((r) => setTimeout(r, 0));
    // Now resolve every started task one by one.
    while (barrier.length > 0) {
      const release = barrier.shift()!;
      release();
      // Give the scheduler a tick so the next task starts.
      await new Promise((r) => setTimeout(r, 0));
    }
    await done;
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(0);
  });

  it('propagates a rejection from any task', async () => {
    const items = [1, 2, 3];
    await expect(
      mapWithConcurrency(items, 2, async (n) => {
        if (n === 2) throw new Error('boom');
        return n;
      }),
    ).rejects.toThrow('boom');
  });

  it('returns [] on empty input without spinning workers', async () => {
    let calls = 0;
    const fn = async (n: number) => {
      calls += 1;
      return n;
    };
    const result = await mapWithConcurrency<number, number>([], 4, fn);
    expect(result).toEqual([]);
    expect(calls).toBe(0);
  });
});
