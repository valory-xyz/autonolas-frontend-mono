import type { WEB3AUTH_LOGIN_EVENTS, WEB3AUTH_SWAP_OWNER_EVENTS } from '../constants/web3auth';

export type Web3AuthStatusResponse = {
  enabled: boolean;
};

export type Web3AuthPageProps = {
  web3AuthEnabled: boolean;
};

export type Web3AuthPageEvents = typeof WEB3AUTH_LOGIN_EVENTS | typeof WEB3AUTH_SWAP_OWNER_EVENTS;
