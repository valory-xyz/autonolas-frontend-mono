/**
 * Creates a promise that resolves after a specified number of milliseconds.
 * This can be used to introduce a delay in an asynchronous operation.
 *
 * @param {number} ms - The number of milliseconds to wait before resolving the promise.
 * @returns {Promise<string>} A promise that resolves with the string 'done' after the delay.
 */
export const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => resolve('done'), ms);
  });
