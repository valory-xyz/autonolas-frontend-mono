import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  celo,
  celoAlfajores,
  gnosis,
  gnosisChiado,
  goerli,
  mainnet,
  mode,
  optimism,
  optimismSepolia,
  polygon,
  polygonMumbai,
} from 'viem/chains';

const MODE_EXPLORER = 'https://explorer.mode.network';

export const EXPLORER_URLS: Record<string, string> = {
  [mainnet.id]: mainnet.blockExplorers.default.url,
  [optimism.id]: optimism.blockExplorers.default.url,
  [gnosis.id]: gnosis.blockExplorers.default.url,
  [polygon.id]: polygon.blockExplorers.default.url,
  [base.id]: base.blockExplorers.default.url,
  [arbitrum.id]: arbitrum.blockExplorers.default.url,
  [celo.id]: celo.blockExplorers.default.url,
  [mode.id]: MODE_EXPLORER,
  [goerli.id]: goerli.blockExplorers.default.url,
  [gnosisChiado.id]: gnosisChiado.blockExplorers.default.url,
  [polygonMumbai.id]: polygonMumbai.blockExplorers.default.url,
  [baseSepolia.id]: baseSepolia.blockExplorers.default.url,
  [arbitrumSepolia.id]: arbitrumSepolia.blockExplorers.default.url,
  [optimismSepolia.id]: optimismSepolia.blockExplorers.default.url,
  [celoAlfajores.id]: celoAlfajores.blockExplorers.default.url,
};
