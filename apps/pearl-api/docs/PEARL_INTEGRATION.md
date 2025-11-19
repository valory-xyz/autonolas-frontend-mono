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

### Method 1: Reuse Login Iframe (Recommended - No Re-login!)

Since Pearl already loads `/web3auth/login` in an **iframe**, you can **reuse that same iframe** for all transactions! Web3Auth sessions persist within the iframe's browser context.

#### Step 1: Login Once at App Start (Using Existing Iframe)

```typescript
// In your Pearl Electron app - assuming you already have iframe logic for login
// This is what you likely already have:

let loginIframe: HTMLIFrameElement | null = null;

async function loginWeb3Auth(): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create or reuse iframe for Web3Auth login
    loginIframe = document.getElementById('web3auth-iframe') as HTMLIFrameElement;
    
    if (!loginIframe) {
      loginIframe = document.createElement('iframe');
      loginIframe.id = 'web3auth-iframe';
      loginIframe.style.position = 'fixed';
      loginIframe.style.top = '0';
      loginIframe.style.left = '0';
      loginIframe.style.width = '100%';
      loginIframe.style.height = '100%';
      loginIframe.style.border = 'none';
      loginIframe.style.zIndex = '9999';
      loginIframe.allow = 'camera;microphone;payment';
      document.body.appendChild(loginIframe);
    }

    // Listen for login success
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.event_id === 'WEB3AUTH_AUTH_SUCCESS') {
        const backupOwnerAddress = event.data.address;
        resolve(backupOwnerAddress);
        // DON'T remove the iframe! Keep it hidden for transactions
        loginIframe!.style.display = 'none';
      } else if (event.data?.event_id === 'WEB3AUTH_MODAL_CLOSED') {
        document.body.removeChild(loginIframe!);
        loginIframe = null;
        reject(new Error('User closed Web3Auth modal'));
      }
    };

    window.addEventListener('message', handleMessage);

    // Load the login page
    loginIframe.src = 'https://pearl-api.olas.network/web3auth/login';
  });
}
```

#### Step 2: Reuse Same Iframe for All Transactions

```typescript
async function swapSafeOwner(params: {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  backupOwnerAddress: string;
  chainId: number;
}) {
  // Make sure user is logged in and iframe exists
  if (!loginIframe) {
    throw new Error('Not logged in. Call loginWeb3Auth() first.');
  }

  try {
    return new Promise<TransactionResult>((resolve, reject) => {
      // Listen for transaction result
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'SWAP_OWNER_RESULT') {
          window.removeEventListener('message', handleMessage);
          
          if (event.data.success) {
            resolve({
              success: true,
              txHash: event.data.txHash,
              chainId: event.data.chainId,
              safeAddress: event.data.safeAddress,
            });
            // Hide iframe again after transaction
            loginIframe!.style.display = 'none';
          } else {
            reject(new Error(event.data.error || 'Transaction failed'));
            loginIframe!.style.display = 'none';
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Show iframe and navigate to transaction page (Web3Auth stays logged in!)
      loginIframe!.style.display = 'block';
      
      const sessionUrl = `https://pearl-api.olas.network/web3auth/swap-owner-session?` +
        `safeAddress=${params.safeAddress}` +
        `&oldOwnerAddress=${params.oldOwnerAddress}` +
        `&newOwnerAddress=${params.newOwnerAddress}` +
        `&backupOwnerAddress=${params.backupOwnerAddress}` +
        `&chainId=${params.chainId}`;

      loginIframe!.src = sessionUrl;

      // Timeout after 5 minutes
      setTimeout(() => {
        loginIframe!.style.display = 'none';
        reject(new Error('Transaction timeout'));
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error('Error swapping owner:', error);
    throw error;
  }
}

// Clean up when done with all operations
function logoutWeb3Auth() {
  if (loginIframe) {
    document.body.removeChild(loginIframe);
    loginIframe = null;
  }
}
```

#### Step 3: Complete Flow for Multiple Chains

```typescript
// Complete flow - login once, process all chains, then logout
async function performOwnerSwapAllChains() {
  try {
    // Step 1: Login once via iframe
    console.log('Logging in with Web3Auth...');
    const backupOwnerAddress = await loginWeb3Auth();
    console.log(`✓ Logged in: ${backupOwnerAddress}`);
    // Iframe is now hidden but still in DOM with Web3Auth session active

    // Step 2: Process all chains using the SAME iframe (no re-login!)
    const chains = [
      {
        chainId: 1,
        chainName: 'Ethereum',
        safeAddress: '0x1234...',
        oldOwnerAddress: '0x5678...',
        newOwnerAddress: '0x9abc...',
        backupOwnerAddress,
      },
      {
        chainId: 100,
        chainName: 'Gnosis',
        safeAddress: '0x2234...',
        oldOwnerAddress: '0x6678...',
        newOwnerAddress: '0xaabc...',
        backupOwnerAddress,
      },
      // More chains...
    ];

    const results = [];

    for (const chain of chains) {
      console.log(`Processing ${chain.chainName}...`);
      
      try {
        // Show iframe, navigate to transaction URL, execute, hide iframe
        const result = await swapSafeOwner(chain);
        results.push({
          chainName: chain.chainName,
          success: true,
          txHash: result.txHash,
        });
        console.log(`✓ ${chain.chainName}: ${result.txHash}`);
      } catch (error) {
        results.push({
          chainName: chain.chainName,
          success: false,
          error: error.message,
        });
        console.error(`✗ ${chain.chainName} failed:`, error);
      }
    }

    // Step 3: Remove iframe when all done
    logoutWeb3Auth();

    // Step 4: Show results
    const allSucceeded = results.every(r => r.success);
    if (allSucceeded) {
      showNotification('✓ Owner swap completed on all chains!');
    } else {
      showNotification('⚠ Some chains failed. Check logs.');
    }

    return results;
  } catch (error) {
    console.error('Failed to login:', error);
    logoutWeb3Auth();
    throw error;
  }
}

// Usage: Call this from a button
button.addEventListener('click', async () => {
  try {
    const results = await performOwnerSwapAllChains();
    console.table(results);
  } catch (error) {
    showNotification('Operation failed');
  }
});
```

### Alternative: Electron BrowserWindow Approach

If you prefer using Electron's BrowserWindow instead of iframe (more native approach):

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

#### Step 2: Handle Multiple Chains (Reuse Browser Window - No Re-login!)

```typescript
// Execute owner swap for multiple chains sequentially
// This approach REUSES the same browser window, so Web3Auth stays logged in!
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

  // Create ONE browser window that we'll reuse
  const sessionWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Process each chain sequentially in the SAME window
  for (const chain of chains) {
    console.log(`Processing chain: ${chain.chainName} (${chain.chainId})`);
    
    try {
      const result = await new Promise<TransactionResult>((resolve, reject) => {
        // Listen for transaction result
        const handleMessage = (event: any) => {
          if (event.data?.type === 'SWAP_OWNER_RESULT') {
            // Remove listener after receiving result
            sessionWindow.webContents.removeListener('ipc-message', handleMessage);
            
            if (event.data.success) {
              resolve(event.data);
            } else {
              reject(new Error(event.data.error || 'Transaction failed'));
            }
          }
        };

        sessionWindow.webContents.on('ipc-message', handleMessage);

        // Navigate to the session URL for this chain
        const sessionUrl = `https://pearl-api.olas.network/web3auth/swap-owner-session?` +
          `safeAddress=${chain.safeAddress}` +
          `&oldOwnerAddress=${chain.oldOwnerAddress}` +
          `&newOwnerAddress=${chain.newOwnerAddress}` +
          `&backupOwnerAddress=${chain.backupOwnerAddress}` +
          `&chainId=${chain.chainId}`;

        sessionWindow.loadURL(sessionUrl);

        // Timeout after 5 minutes
        setTimeout(() => {
          reject(new Error('Transaction timeout'));
        }, 5 * 60 * 1000);
      });
      
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

  // Close the window after all chains are processed
  sessionWindow.close();

  return results;
}

// Alternative: If you want to close window between chains (requires re-login)
async function swapOwnerMultipleChainsWithRelogin(chains: Array<{...}>) {
  const results = [];

  for (const chain of chains) {
    try {
      // This will open a NEW window each time, requiring re-login
      const result = await swapSafeOwner(chain);
      results.push({ ...chain, success: true, txHash: result.txHash });
    } catch (error) {
      results.push({ ...chain, success: false, error: error.message });
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

## Web3Auth Session Management

### Optimal Flow: Login Once via Iframe, Execute Many Transactions

**The Best Approach**: Use the existing `/web3auth/login` page loaded in an **iframe** to authenticate once, then reuse that iframe!

```
User clicks "Start Recovery" in Pearl
         ↓
Show iframe with /web3auth/login
         ↓
User logs in with Web3Auth (one time only!)
         ↓
Pearl receives backup owner address
         ↓
Hide iframe but KEEP IT IN DOM (Web3Auth session persists!)
         ↓
Chain 1: Show iframe → Navigate to /swap-owner-session → Execute → Hide
         ↓
Chain 2: Show iframe → Navigate to /swap-owner-session → Execute → Hide (NO re-login!)
         ↓
Chain 3: Show iframe → Navigate to /swap-owner-session → Execute → Hide (NO re-login!)
         ↓
All done? Remove iframe from DOM
```

### Key Insight: Iframe Persistence = Session Persistence

When you **reuse the same iframe**:
- ✅ Web3Auth session persists in the iframe's browser context
- ✅ No re-authentication needed for subsequent transactions
- ✅ Just navigate the iframe's `src` to different URLs
- ✅ Hide/show iframe as needed (user won't see it flash between transactions)

### Timeline Comparison

#### ❌ Without Reusing Iframe (Old Method)
```
Create iframe → Login: 30s → Chain 1: 30s → Remove iframe
Create iframe → Login: 20s → Chain 2: 30s → Remove iframe
Create iframe → Login: 20s → Chain 3: 30s → Remove iframe
Total: ~3 minutes for 3 chains
```

#### ✅ With Reusing Iframe (Recommended)
```
Create iframe → Login: 30s → Hide iframe
Show iframe → Chain 1: 30s → Hide iframe
Show iframe → Chain 2: 5s → Hide iframe (instant, already logged in!)
Show iframe → Chain 3: 5s → Hide iframe (instant, already logged in!)
Remove iframe
Total: ~70 seconds for 3 chains
```

### Does User Need to Login for Each Chain?

**No!** When you reuse the iframe:

#### Option 1: Reuse Browser Window (Recommended) ✅
- **Login once**: User logs in for the first transaction
- **Stays logged in**: Subsequent chains use the same Web3Auth session
- **No re-authentication**: Just navigate to new URLs in same window
- **Faster**: Each subsequent transaction takes seconds instead of requiring login

```typescript
// Open ONE window, process all chains
const sessionWindow = new BrowserWindow({...});

for (const chain of chains) {
  // Navigate to new URL - Web3Auth stays logged in!
  sessionWindow.loadURL(`...?chainId=${chain.chainId}...`);
  await waitForResult();
}

sessionWindow.close(); // Close after all chains
```

#### Option 2: New Window Each Time (Not Recommended) ❌
- **Login every time**: User must authenticate for each chain
- **Slower**: Adds 10-30 seconds per chain for login
- **Poor UX**: Repetitive authentication flow

```typescript
// Opens NEW window each time - requires re-login
for (const chain of chains) {
  const result = await swapSafeOwner(chain); // New window
}
```

### Session Persistence

Web3Auth sessions persist:
- ✅ **Same browser window**: Session stays active across page navigations
- ✅ **Same browser profile**: If window closes, session may persist (depends on Web3Auth settings)
- ❌ **Different browser windows**: Each new window starts fresh session
- ❌ **Different devices**: Cannot share sessions across devices

### Can You Pass Credentials Directly?

**No**, Web3Auth doesn't support passing credentials in the URL for security reasons. However:

1. **Use the same window**: Best approach for multiple chains
2. **Web3Auth remembers user**: If user closes and reopens within session timeout, may auto-login
3. **Session storage**: Web3Auth uses localStorage/sessionStorage to maintain state

## Security Considerations

1. **CORS**: The API endpoints have CORS enabled. In production, restrict to specific origins.

2. **Address Validation**: All addresses are validated server-side using `viem.isAddress()`

3. **Web3Auth**: Uses secure authentication flow with user's backup owner wallet

4. **Transaction Signing**: Transactions are signed by the backup owner on the client side

5. **postMessage**: Communication uses `window.postMessage()`. In production, verify message origins.

6. **No Credential Passing**: Never pass private keys or credentials in URLs - Web3Auth handles authentication securely

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
