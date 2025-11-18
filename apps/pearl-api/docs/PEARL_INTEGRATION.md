# Pearl Electron App Integration Guide

## Overview
This guide explains how to integrate Safe owner swap functionality from Pearl Electron app using the pearl-api monorepo services.

## Architecture

```
Pearl Electron App
    ↓ (HTTP POST)
API: /api/web3auth/swap-owner
    ↓ (returns session URL)
Pearl opens URL in BrowserWindow
    ↓ (Web3Auth + Safe transaction)
Browser Page: /web3auth/swap-owner-session
    ↓ (postMessage)
Pearl receives result
```

## Integration Methods

### Method 1: Direct Browser Window (Recommended for Electron)

This method is best for Electron apps as it provides a clean user experience with Web3Auth modal.

#### Step 1: Call the API from Pearl

```typescript
// In your Pearl Electron app
import { BrowserWindow } from 'electron';

async function swapSafeOwner(params: {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
  chainId: number;
}) {
  try {
    // Step 1: Validate parameters and get session URL
    const response = await fetch('https://pearl-api.olas.network/api/web3auth/swap-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    // Step 2: Open the session URL in a new browser window
    const sessionWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Step 3: Listen for transaction result from the browser window
    return new Promise<TransactionResult>((resolve, reject) => {
      // Listen for messages from the browser window
      const handleMessage = (event: any) => {
        if (event.data?.type === 'SWAP_OWNER_RESULT') {
          if (event.data.success) {
            resolve({
              success: true,
              txHash: event.data.txHash,
              chainId: event.data.chainId,
              safeAddress: event.data.safeAddress,
            });
          } else {
            reject(new Error(event.data.error || 'Transaction failed'));
          }
          
          // Close the window after receiving result
          sessionWindow.close();
        }
      };

      // Set up the message listener
      sessionWindow.webContents.on('ipc-message', handleMessage);

      // Load the session URL
      const sessionUrl = `https://pearl-api.olas.network/web3auth/swap-owner-session?` +
        `safeAddress=${params.safeAddress}` +
        `&oldOwnerAddress=${params.oldOwnerAddress}` +
        `&newOwnerAddress=${params.newOwnerAddress}` +
        `&backupOwnerAddress=${params.backupOwnerAddress}` +
        `&chainId=${params.chainId}`;

      sessionWindow.loadURL(sessionUrl);

      // Handle window close
      sessionWindow.on('closed', () => {
        reject(new Error('User closed the window'));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        sessionWindow.close();
        reject(new Error('Transaction timeout'));
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error('Error swapping owner:', error);
    throw error;
  }
}
```

#### Step 2: Handle Multiple Chains

```typescript
// Execute owner swap for multiple chains sequentially
async function swapOwnerMultipleChains(chains: Array<{
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
  chainId: number;
  chainName: string;
}>) {
  const results: Array<{
    chainId: number;
    chainName: string;
    success: boolean;
    txHash?: string;
    error?: string;
  }> = [];

  for (const chain of chains) {
    console.log(`Processing chain: ${chain.chainName} (${chain.chainId})`);
    
    try {
      const result = await swapSafeOwner(chain);
      
      results.push({
        chainId: chain.chainId,
        chainName: chain.chainName,
        success: true,
        txHash: result.txHash,
      });
      
      console.log(`✓ Success on ${chain.chainName}: ${result.txHash}`);
    } catch (error) {
      results.push({
        chainId: chain.chainId,
        chainName: chain.chainName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.error(`✗ Failed on ${chain.chainName}:`, error);
      
      // Optionally: stop on first error or continue
      // break; // Uncomment to stop on first error
    }
  }

  return results;
}
```

#### Step 3: Usage Example

```typescript
// Example: Button click handler in Pearl
button.addEventListener('click', async () => {
  const chains = [
    {
      chainId: 1,
      chainName: 'Ethereum Mainnet',
      safeAddress: '0x1234...',
      oldOwnerAddress: '0x5678...',
      newOwnerAddress: '0x9abc...',
      backupOwnerAddress: '0xdef0...',
    },
    {
      chainId: 100,
      chainName: 'Gnosis Chain',
      safeAddress: '0x2234...',
      oldOwnerAddress: '0x6678...',
      newOwnerAddress: '0xaabc...',
      backupOwnerAddress: '0xeef0...',
    },
    // Add more chains as needed
  ];

  try {
    const results = await swapOwnerMultipleChains(chains);
    
    // Check if all succeeded
    const allSucceeded = results.every(r => r.success);
    
    if (allSucceeded) {
      console.log('✓ All chains completed successfully!');
      showNotification('Owner swap completed on all chains!');
    } else {
      console.log('⚠ Some chains failed');
      showNotification('Owner swap completed with some failures. Check logs.');
    }
    
    // Display results to user
    console.table(results);
  } catch (error) {
    console.error('Fatal error:', error);
    showNotification('Failed to start owner swap process');
  }
});
```

## API Endpoints

### POST `/api/web3auth/swap-owner`

**Purpose**: Validate parameters and initiate owner swap session

**Request Body**:
```typescript
{
  safeAddress: string;        // Safe contract address
  oldOwnerAddress: string;    // Current master EOA to remove
  newOwnerAddress: string;    // New master EOA to add
  backupOwnerAddress: string; // Backup owner (used as signer)
  chainId: number;            // Chain ID (1 for Ethereum, 100 for Gnosis, etc.)
}
```

**Response**:
```typescript
{
  success: boolean;
  message?: string;
  chainId?: number;
  error?: string;
}
```

## Browser Page

### `/web3auth/swap-owner-session`

**Purpose**: Execute the Safe owner swap transaction with Web3Auth

**Query Parameters**:
- `safeAddress`: Safe contract address
- `oldOwnerAddress`: Old owner to remove
- `newOwnerAddress`: New owner to add
- `backupOwnerAddress`: Backup owner (signer)
- `chainId`: Chain ID

**User Flow**:
1. Page loads and initializes Web3Auth
2. User authenticates with Web3Auth (if not already)
3. Transaction is created and executed via Safe Protocol Kit
4. Result is posted back to parent window (Pearl)
5. Page displays success/failure message

## Error Handling

### Common Errors

1. **Invalid Address Format**
   - Error: "One or more addresses are invalid"
   - Fix: Ensure all addresses are valid Ethereum addresses

2. **Missing Required Fields**
   - Error: "Missing required fields"
   - Fix: Ensure all fields (safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, chainId) are provided

3. **Transaction Execution Failed**
   - Error: Varies (e.g., "insufficient funds", "invalid signature")
   - Fix: Check Safe configuration, backup owner has correct permissions, sufficient gas

4. **User Closed Window**
   - Error: "User closed the window"
   - Fix: User cancelled the operation - handle gracefully in Pearl

5. **Transaction Timeout**
   - Error: "Transaction timeout"
   - Fix: Transaction took too long - may need to retry

### Error Handling Pattern

```typescript
try {
  const result = await swapSafeOwner(params);
  console.log('Success:', result.txHash);
} catch (error) {
  if (error.message === 'User closed the window') {
    // User cancelled - don't show error
    console.log('User cancelled transaction');
  } else if (error.message === 'Transaction timeout') {
    // Timeout - ask user to retry
    showNotification('Transaction timed out. Please try again.');
  } else {
    // Other errors - show to user
    showNotification(`Transaction failed: ${error.message}`);
  }
}
```

## Transaction Result Format

```typescript
type TransactionResult = {
  success: boolean;
  txHash?: string;        // Transaction hash if successful
  error?: string;         // Error message if failed
  chainId?: number;       // Chain ID of the transaction
  safeAddress?: string;   // Safe address involved
};
```

## Security Considerations

1. **CORS**: The API endpoints have CORS enabled. In production, restrict to specific origins.

2. **Address Validation**: All addresses are validated server-side using `viem.isAddress()`

3. **Web3Auth**: Uses secure authentication flow with user's backup owner wallet

4. **Transaction Signing**: Transactions are signed by the backup owner on the client side

5. **postMessage**: Communication uses `window.postMessage()`. In production, verify message origins.

## Testing

### Test with Single Chain

```typescript
const testParams = {
  safeAddress: '0x...',
  oldOwnerAddress: '0x...',
  newOwnerAddress: '0x...',
  backupOwnerAddress: '0x...',
  chainId: 5, // Goerli testnet
};

swapSafeOwner(testParams)
  .then(result => console.log('Test passed:', result))
  .catch(error => console.error('Test failed:', error));
```

## Deployment

1. Deploy pearl-api monorepo to `https://pearl-api.olas.network`
2. Ensure Web3Auth is configured with correct client ID
3. Test on testnet chains first (Goerli, Sepolia, etc.)
4. Configure CORS for production Pearl app origin

## Support

For issues or questions:
- Check browser console for detailed error messages
- Check pearl-api server logs
- Verify Safe configuration (owners, threshold)
- Ensure backup owner has correct permissions
