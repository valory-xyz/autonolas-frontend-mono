import { IProvider } from '@web3auth/modal';

const MAX_RECEIPT_POLL_ATTEMPTS = 60;
const RECEIPT_POLL_INTERVAL_MS = 5000; // 5 seconds

type TransactionReceipt = {
  status: string;
  blockHash: string;
  blockNumber: string;
  transactionHash: string;
  gasUsed: string;
};

/**
 * Polls for transaction receipt until confirmed or timeout
 * @param provider - EIP-1193 provider
 * @param txHash - Transaction hash to poll
 * @param onProgress - Callback for progress updates
 * @returns Transaction receipt
 * @throws Error if transaction reverted or timeout
 */
export async function waitForTransactionReceipt(
  provider: IProvider,
  txHash: string,
  onProgress?: (attempt: number, maxAttempts: number) => void,
): Promise<TransactionReceipt> {
  let receipt: TransactionReceipt | null = null;
  let attempts = 0;

  while (!receipt && attempts < MAX_RECEIPT_POLL_ATTEMPTS) {
    try {
      const result = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      if (result) {
        receipt = result as TransactionReceipt;

        // Check if transaction was successful (status === '0x1')
        if (receipt.status === '0x0') {
          throw new Error('Transaction failed on-chain. The transaction was mined but reverted.');
        }
        break;
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, RECEIPT_POLL_INTERVAL_MS));
      attempts++;
      onProgress?.(attempts, MAX_RECEIPT_POLL_ATTEMPTS);
    } catch (error) {
      // If we get an error other than receipt not found, check if we should retry
      if (attempts >= MAX_RECEIPT_POLL_ATTEMPTS - 1) {
        throw new Error(
          `Transaction receipt not found after ${MAX_RECEIPT_POLL_ATTEMPTS} attempts. Transaction may still be pending. Hash: ${txHash}`,
        );
      }

      // Continue polling
      await new Promise((resolve) => setTimeout(resolve, RECEIPT_POLL_INTERVAL_MS));
      attempts++;
      onProgress?.(attempts, MAX_RECEIPT_POLL_ATTEMPTS);
    }
  }

  if (!receipt) {
    throw new Error(
      `Transaction confirmation timeout. Transaction may still be pending. Hash: ${txHash}`,
    );
  }

  return receipt;
}
