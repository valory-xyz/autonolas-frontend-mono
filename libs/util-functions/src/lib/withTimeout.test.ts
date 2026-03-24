import { withTimeout } from './withTimeout';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('withTimeout', () => {
  it('resolves with the value when the promise settles before the timeout', async () => {
    const promise = Promise.resolve('ok');
    await expect(withTimeout(promise, 5000)).resolves.toBe('ok');
  });

  it('rejects with the original error when the promise rejects before the timeout', async () => {
    const promise = Promise.reject(new Error('boom'));
    await expect(withTimeout(promise, 5000)).rejects.toThrow('boom');
  });

  it('rejects with a timeout error when the promise does not settle in time', async () => {
    const promise = new Promise<string>(() => {
      /* never settles */
    });
    const result = withTimeout(promise, 3000);

    jest.advanceTimersByTime(3000);

    await expect(result).rejects.toThrow('Timeout after 3000ms');
  });

  it('includes the timeout duration in the error message', async () => {
    const promise = new Promise<void>(() => {});
    const result = withTimeout(promise, 1234);

    jest.advanceTimersByTime(1234);

    await expect(result).rejects.toThrow('Timeout after 1234ms');
  });

  it('does not reject after timeout if the promise resolves first', async () => {
    let resolve!: (v: string) => void;
    const promise = new Promise<string>((r) => {
      resolve = r;
    });
    const result = withTimeout(promise, 5000);

    resolve('early');
    await expect(result).resolves.toBe('early');

    // Advance past the timeout — should not cause an unhandled rejection
    jest.advanceTimersByTime(5000);
  });

  it('clears the timeout when the promise resolves early', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const promise = Promise.resolve('done');

    await withTimeout(promise, 5000);

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    clearTimeoutSpy.mockRestore();
  });

  it('clears the timeout when the promise rejects early', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const promise = Promise.reject(new Error('fail'));

    await expect(withTimeout(promise, 5000)).rejects.toThrow('fail');

    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    clearTimeoutSpy.mockRestore();
  });
});
