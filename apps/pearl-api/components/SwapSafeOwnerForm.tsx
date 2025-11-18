import React, { useState, useRef, useEffect } from 'react';
import { Address } from 'viem';

type SwapOwnerFormProps = {
  safeAddress: Address;
  oldOwnerAddress: Address;
  newOwnerAddress: Address;
  backupOwnerAddress: Address;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
};

enum Events {
  SWAP_OWNER_SUCCESS = 'SWAP_OWNER_SUCCESS',
  SWAP_OWNER_ERROR = 'SWAP_OWNER_ERROR',
  SWAP_OWNER_INITIALIZED = 'SWAP_OWNER_INITIALIZED',
  SWAP_OWNER_PROGRESS = 'SWAP_OWNER_PROGRESS',
}

export function SwapSafeOwnerForm({
  safeAddress,
  oldOwnerAddress,
  newOwnerAddress,
  backupOwnerAddress,
  onSuccess,
  onError,
}: SwapOwnerFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin in production
      // if (event.origin !== 'https://pearl-api.olas.network') return;

      switch (event.data.event_id) {
        case Events.SWAP_OWNER_INITIALIZED:
          setStatus('Web3Auth initialized');
          // Send transaction parameters to iframe
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                action: 'EXECUTE_SWAP_OWNER',
                params: {
                  safeAddress,
                  oldOwnerAddress,
                  newOwnerAddress,
                  backupOwnerAddress,
                },
              },
              '*',
            );
          }
          break;

        case Events.SWAP_OWNER_PROGRESS:
          setStatus(event.data.message);
          break;

        case Events.SWAP_OWNER_SUCCESS:
          setTxHash(event.data.txHash);
          setStatus('Transaction successful!');
          setIsProcessing(false);
          setShowIframe(false);
          if (onSuccess) onSuccess(event.data.txHash);
          break;

        case Events.SWAP_OWNER_ERROR: {
          const errorMsg = event.data.error || 'Transaction failed';
          setError(errorMsg);
          setStatus('Transaction failed');
          setIsProcessing(false);
          setShowIframe(false);
          if (onError) onError(errorMsg);
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [safeAddress, oldOwnerAddress, newOwnerAddress, backupOwnerAddress, onSuccess, onError]);

  async function handleSubmit() {
    setError(null);
    setTxHash(null);
    setStatus('');
    setIsProcessing(true);

    try {
      // Call validation API
      const response = await fetch('https://pearl-api.olas.network/api/web3auth/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safeAddress,
          oldOwnerAddress,
          newOwnerAddress,
          backupOwnerAddress,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Validation failed');
      }

      // If validation passes, show iframe to execute transaction
      setStatus('Opening Web3Auth...');
      setShowIframe(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setIsProcessing(false);
      if (onError) onError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={handleSubmit}
        disabled={isProcessing}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          backgroundColor: isProcessing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {isProcessing ? 'Processing...' : 'Submit Transaction'}
      </button>

      {status && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          }}
        >
          Status: {status}
        </div>
      )}

      {txHash && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
          }}
        >
          <strong>Transaction sent!</strong>
          <br />
          Hash: {txHash}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Hidden iframe for Web3Auth */}
      {showIframe && (
        <iframe
          ref={iframeRef}
          src="https://pearl-api.olas.network/web3auth/swap-owner"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 9999,
          }}
          allow="camera;microphone;payment"
        />
      )}
    </div>
  );
}
