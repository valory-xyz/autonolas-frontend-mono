# Pearl Multi-Chain Integration Guide

## Complete Implementation for Safe Owner Swap Across Multiple Chains

This guide shows how to integrate the Safe owner swap functionality from Pearl Electron app with support for multiple chains.

---

## Architecture Overview

```
Pearl Electron App
    ↓
Opens iframe with swap-owner-session page
    ↓
Web3Auth modal appears (user authenticates once)
    ↓
Transaction executes for Chain 1
    ↓
Pearl receives result via postMessage
    ↓
Navigate iframe to Chain 2 (Web3Auth stays logged in!)
    ↓
Transaction executes for Chain 2
    ↓
Pearl receives result via postMessage
    ↓
Repeat for all chains...
    ↓
Close iframe when done
```

---

## Complete Pearl Implementation

### Step 1: Create Iframe Manager

```typescript
// iframe-manager.ts
import { EventEmitter } from 'events';

type TransactionParams = {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
  chainId: number;
  chainName: string;
};

type TransactionResult = {
  success: boolean;
  txHash?: string;
  error?: string;
  chainId?: number;
  safeAddress?: string;
};

enum Events {
  WEB3AUTH_MODAL_INITIALIZED = 'WEB3AUTH_MODAL_INITIALIZED',
  WEB3AUTH_SWAP_OWNER_RESULT = 'WEB3AUTH_SWAP_OWNER_RESULT',
  WEB3AUTH_MODAL_CLOSED = 'WEB3AUTH_MODAL_CLOSED',
}

export class Web3AuthIframeManager extends EventEmitter {
  private iframe: HTMLIFrameElement | null = null;
  private isInitialized = false;
  private currentChainId: number | null = null;

  constructor() {
    super();
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Create and show the iframe
   */
  createIframe(): void {
    if (this.iframe) {
      this.iframe.style.display = 'block';
      return;
    }

    this.iframe = document.createElement('iframe');
    this.iframe.style.position = 'fixed';
    this.iframe.style.top = '0';
    this.iframe.style.left = '0';
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.zIndex = '9999';
    this.iframe.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.iframe.allow = 'camera;microphone;payment';

    document.body.appendChild(this.iframe);
    window.addEventListener('message', this.handleMessage);
  }

  /**
   * Hide the iframe (but keep it in DOM to maintain Web3Auth session)
   */
  hideIframe(): void {
    if (this.iframe) {
      this.iframe.style.display = 'none';
    }
  }

  /**
   * Remove the iframe completely (destroys Web3Auth session)
   */
  destroyIframe(): void {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
      this.isInitialized = false;
    }
    window.removeEventListener('message', this.handleMessage);
  }

  /**
   * Execute a transaction for a specific chain
   */
  executeTransaction(params: TransactionParams): Promise<TransactionResult> {
    return new Promise((resolve, reject) => {
      if (!this.iframe) {
        this.createIframe();
      }

      this.currentChainId = params.chainId;

      // Build the URL with query parameters
      const url = new URL('https://pearl-api.olas.network/web3auth/swap-owner-session');
      url.searchParams.set('safeAddress', params.safeAddress);
      url.searchParams.set('oldOwnerAddress', params.oldOwnerAddress);
      url.searchParams.set('newOwnerAddress', params.newOwnerAddress);
      url.searchParams.set('backupOwnerAddress', params.backupOwnerAddress);
      url.searchParams.set('chainId', params.chainId.toString());

      // Set up one-time listeners for this transaction
      const successHandler = (result: TransactionResult) => {
        if (result.chainId === params.chainId) {
          this.off('transaction-success', successHandler);
          this.off('transaction-error', errorHandler);
          this.off('user-cancelled', cancelHandler);
          resolve(result);
        }
      };

      const errorHandler = (result: TransactionResult) => {
        if (result.chainId === params.chainId) {
          this.off('transaction-success', successHandler);
          this.off('transaction-error', errorHandler);
          this.off('user-cancelled', cancelHandler);
          reject(new Error(result.error || 'Transaction failed'));
        }
      };

      const cancelHandler = () => {
        this.off('transaction-success', successHandler);
        this.off('transaction-error', errorHandler);
        this.off('user-cancelled', cancelHandler);
        reject(new Error('User cancelled transaction'));
      };

      this.on('transaction-success', successHandler);
      this.on('transaction-error', errorHandler);
      this.on('user-cancelled', cancelHandler);

      // Show iframe and load the URL
      this.iframe!.style.display = 'block';
      this.iframe!.src = url.toString();
    });
  }

  /**
   * Handle postMessage events from the iframe
   */
  private handleMessage(event: MessageEvent): void {
    // Security: In production, verify event.origin
    // if (event.origin !== 'https://pearl-api.olas.network') return;

    const { type, ...data } = event.data;

    switch (type) {
      case Events.WEB3AUTH_MODAL_INITIALIZED:
        this.isInitialized = true;
        this.emit('initialized');
        break;

      case Events.WEB3AUTH_SWAP_OWNER_RESULT:
        if (data.success) {
          this.emit('transaction-success', data);
        } else {
          this.emit('transaction-error', data);
        }
        break;

      case Events.WEB3AUTH_MODAL_CLOSED:
        this.emit('user-cancelled');
        break;
    }
  }
}
```

---

### Step 2: Multi-Chain Transaction Handler

```typescript
// multi-chain-swap.ts
import { Web3AuthIframeManager } from './iframe-manager';

type ChainConfig = {
  chainId: number;
  chainName: string;
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
};

type ChainResult = {
  chainId: number;
  chainName: string;
  success: boolean;
  txHash?: string;
  error?: string;
};

export class MultiChainSwapManager {
  private iframeManager: Web3AuthIframeManager;

  constructor() {
    this.iframeManager = new Web3AuthIframeManager();
  }

  /**
   * Execute owner swap across multiple chains sequentially
   */
  async executeMultiChainSwap(chains: ChainConfig[]): Promise<ChainResult[]> {
    const results: ChainResult[] = [];

    console.log(`Starting owner swap for ${chains.length} chains...`);

    // Create iframe once for all transactions
    this.iframeManager.createIframe();

    try {
      for (const chain of chains) {
        console.log(`Processing ${chain.chainName} (Chain ID: ${chain.chainId})...`);

        try {
          const result = await this.iframeManager.executeTransaction({
            safeAddress: chain.safeAddress,
            oldOwnerAddress: chain.oldOwnerAddress,
            newOwnerAddress: chain.newOwnerAddress,
            backupOwnerAddress: chain.backupOwnerAddress,
            chainId: chain.chainId,
            chainName: chain.chainName,
          });

          results.push({
            chainId: chain.chainId,
            chainName: chain.chainName,
            success: true,
            txHash: result.txHash,
          });

          console.log(`✓ ${chain.chainName} completed: ${result.txHash}`);

          // Optional: Hide iframe between transactions to show progress in Pearl
          // this.iframeManager.hideIframe();
          // await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          results.push({
            chainId: chain.chainId,
            chainName: chain.chainName,
            success: false,
            error: errorMessage,
          });

          console.error(`✗ ${chain.chainName} failed: ${errorMessage}`);

          // Decide whether to continue or stop on first error
          // Option 1: Continue to next chain
          // continue;

          // Option 2: Stop on first error
          // break;
        }
      }
    } finally {
      // Clean up: Remove iframe when all chains are processed
      this.iframeManager.destroyIframe();
    }

    return results;
  }

  /**
   * Cancel ongoing operations
   */
  cancel(): void {
    this.iframeManager.destroyIframe();
  }
}
```

---

### Step 3: Usage in Pearl App

```typescript
// In your Pearl Electron app (e.g., recovery-dialog.ts)
import { MultiChainSwapManager } from './multi-chain-swap';

// Button click handler
async function handleRecoveryButtonClick() {
  const manager = new MultiChainSwapManager();

  // Define all chains to process
  const chains = [
    {
      chainId: 1,
      chainName: 'Ethereum Mainnet',
      safeAddress: '0x1234...',
      oldOwnerAddress: '0x5678...',
      newOwnerAddress: '0x9abc...',
      backupOwnerAddress: '0xdef0...', // Must be Web3Auth login address
    },
    {
      chainId: 100,
      chainName: 'Gnosis Chain',
      safeAddress: '0x2234...',
      oldOwnerAddress: '0x6678...',
      newOwnerAddress: '0xaabc...',
      backupOwnerAddress: '0xdef0...', // Same backup owner
    },
    {
      chainId: 137,
      chainName: 'Polygon',
      safeAddress: '0x3234...',
      oldOwnerAddress: '0x7678...',
      newOwnerAddress: '0xbabc...',
      backupOwnerAddress: '0xdef0...', // Same backup owner
    },
    // Add more chains as needed
  ];

  try {
    // Show loading UI
    showLoadingIndicator(`Processing ${chains.length} chains...`);

    // Execute all transactions
    const results = await manager.executeMultiChainSwap(chains);

    // Check results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (failed.length === 0) {
      showSuccessMessage(`✓ All ${chains.length} chains completed successfully!`);
    } else {
      showPartialSuccessMessage(
        `${successful.length}/${chains.length} chains completed. ${failed.length} failed.`
      );
    }

    // Log details
    console.table(results);

    // Show detailed results to user
    displayResults(results);
  } catch (error) {
    console.error('Fatal error during multi-chain swap:', error);
    showErrorMessage('Failed to complete owner swap. Please try again.');
  }
}

// Helper function to display results
function displayResults(results: ChainResult[]) {
  const resultHtml = results.map(r => {
    const status = r.success ? '✓' : '✗';
    const detail = r.success 
      ? `TX: ${r.txHash?.substring(0, 10)}...`
      : `Error: ${r.error}`;
    
    return `${status} ${r.chainName}: ${detail}`;
  }).join('\n');

  showDialog('Transaction Results', resultHtml);
}
```

---

## Important Notes

### 1. **Backup Owner Address**
The `backupOwnerAddress` **MUST** be the address that will be logged into Web3Auth:
- If user logs in with `backup@example.com`, that email's Web3Auth address must match `backupOwnerAddress`
- Pearl should retrieve this address during initial setup/configuration
- The address validation happens automatically in the session page

### 2. **Web3Auth Session Persistence**
- User logs in **once** for the first chain
- Session persists in iframe for all subsequent chains
- No re-authentication required (fast transactions)
- Session destroyed when iframe is removed

### 3. **Error Handling Strategy**
Choose one based on your requirements:

**Option A: Continue on error** (recommended)
```typescript
// In the catch block
continue; // Process remaining chains
```

**Option B: Stop on first error**
```typescript
// In the catch block
break; // Stop processing
```

### 4. **User Experience**
- First chain: ~30 seconds (login + transaction)
- Subsequent chains: ~5-10 seconds (just transaction)
- Total for 5 chains: ~60-70 seconds

---

## Events Reference

### From Iframe to Pearl

| Event | When Fired | Data |
|-------|------------|------|
| `WEB3AUTH_MODAL_INITIALIZED` | Web3Auth is ready | `{ type: string }` |
| `WEB3AUTH_SWAP_OWNER_RESULT` | Transaction completed | `{ type, success, txHash?, error?, chainId, safeAddress }` |
| `WEB3AUTH_MODAL_CLOSED` | User cancelled | `{ type, success: false, error: string }` |

---

## Testing

### Test with Single Chain First
```typescript
const testChains = [{
  chainId: 5, // Goerli testnet
  chainName: 'Goerli',
  safeAddress: '0x...',
  oldOwnerAddress: '0x...',
  newOwnerAddress: '0x...',
  backupOwnerAddress: '0x...',
}];

const results = await manager.executeMultiChainSwap(testChains);
```

### Then Test with Multiple Chains
```typescript
const testChains = [
  { chainId: 5, chainName: 'Goerli', ... },
  { chainId: 80001, chainName: 'Mumbai', ... },
];
```

---

## Production Considerations

1. **Origin Verification**: Uncomment origin check in `handleMessage`:
   ```typescript
   if (event.origin !== 'https://pearl-api.olas.network') return;
   ```

2. **Error Logging**: Send errors to analytics/monitoring

3. **Retry Logic**: Add retry for failed chains

4. **User Confirmation**: Ask user before retrying failed chains

5. **Progress UI**: Show live progress as chains complete

---

## Summary

✅ **Files Required:**
- `/pages/web3auth/swap-owner-session.tsx` - Main transaction page
- `/context/Web3AuthProvider.tsx` - Web3Auth configuration

✅ **Pearl Implementation:**
- Create `Web3AuthIframeManager` class
- Create `MultiChainSwapManager` class
- Call `executeMultiChainSwap()` with chain configs

✅ **Flow:**
1. User clicks recovery button in Pearl
2. Pearl creates iframe with first chain URL
3. User logs into Web3Auth (one time)
4. Transaction executes for chain 1
5. Pearl receives result, navigates iframe to chain 2
6. Repeat for all chains (no re-login!)
7. Pearl removes iframe when done

That's it! You now have a complete multi-chain Safe owner swap system! 🚀
