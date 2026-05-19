declare global {
  interface Window {
    // The raw EIP-1193 provider returned by the active wagmi connector. Set by
    // components/Login/LoginV2 and read by libs/util-functions/getModalProvider
    // for the legacy gnosis-safe transaction polling path.
    MODAL_PROVIDER: unknown;
  }
}

export {};
