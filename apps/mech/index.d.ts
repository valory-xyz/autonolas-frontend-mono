import { BrowserProvider, Eip1193Provider } from 'ethers';
declare global {
  interface Window {
    MODAL_PROVIDER?: ModalProvider;
    ethereum?: Eip1193Provider & BrowserProvider & { chainId?: string };
  }
}
