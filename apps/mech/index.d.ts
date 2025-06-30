import { BrowserProvider, Eip1193Provider } from 'ethers';

declare namespace JSX {
  interface IntrinsicElements {
    'w3m-button': {
      disabled?: boolean;
      balance?: 'show' | 'hide';
      size?: 'md' | 'sm';
      label?: string;
      loadingLabel?: string;
    };
  }
}

declare global {
  interface Window {
    MODAL_PROVIDER?: ModalProvider;
    ethereum?: Eip1193Provider & BrowserProvider;
  }
}
