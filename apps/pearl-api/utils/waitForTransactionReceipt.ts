import { IProvider } from '@web3auth/modal';

const MAX_RECEIPT_POLL_ATTEMPTS = 60;
const RECEIPT_POLL_INTERVAL_MS = 5000; // 5 seconds

type TransactionReceipt = {
  status: string; // '0x1' (success) or '0x0' (revert)
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
};

type Receipt = TransactionReceipt | null;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls for transaction receipt until confirmed or timeout
 *
 * @returns Transaction receipt
 * @throws Error if transaction reverted or timeout
 */
export async function waitForTransactionReceipt(
  provider: IProvider,
  txHash: string,
  onProgress?: (attempt: number, maxAttempts: number) => void,
): Promise<TransactionReceipt> {
  let attempts = 0;

  while (attempts < MAX_RECEIPT_POLL_ATTEMPTS) {
    let result: Receipt = null;

    // Fetch receipt
    try {
      result = (await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      })) as Receipt;
    } catch (error) {
      if (attempts >= MAX_RECEIPT_POLL_ATTEMPTS - 1) {
        const lastError = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to fetch transaction receipt after ${MAX_RECEIPT_POLL_ATTEMPTS} attempts. Last error: ${lastError}`,
        );
      }
    }

    if (result) {
      // If chain returns explicit revert, surface it immediately
      if (result.status === '0x0') {
        throw new Error('Transaction failed on-chain. The transaction was mined but reverted.');
      }

      // Optionally enforce success:
      // if (result.status !== '0x1') {
      //   throw new Error(`Unexpected transaction status: ${result.status ?? 'unknown'}`);
      // }

      return result;
    }

    attempts++;
    onProgress?.(attempts, MAX_RECEIPT_POLL_ATTEMPTS);
    await delay(RECEIPT_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Transaction confirmation timeout. Transaction may still be pending. Hash: ${txHash}`,
  );
}
