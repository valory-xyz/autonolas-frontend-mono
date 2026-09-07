/**
 * Proposals identified as hostile to the protocol.
 *
 * Both entries below hand ownership of protocol assets to an externally owned account. They are
 * flagged here so the interface cannot be used to vote them through by accident: the `For` option is
 * disabled and a warning is shown on the proposal.
 *
 * This is a safeguard in this interface only. GovernorOLAS is permissionless — a `For` vote can
 * still be cast directly against the contract, and the flag has no effect on chain.
 *
 * Add an entry only for a proposal whose on-chain calldata is verifiably hostile, and say what the
 * calldata does rather than characterising the proposer.
 */
export type FlaggedProposal = {
  /** Decimal proposal id, as returned by the subgraph. */
  proposalId: string;
  /** What the proposal's calldata does, in one line. */
  summary: string;
  /** One entry per action, in calldata order. */
  actions: string[];
};

/** Autonolas DAO Constitution, referenced by every legitimate proposal's description. */
export const DAO_CONSTITUTION_URL =
  'https://gateway.autonolas.tech/ipfs/bafybeibrhz6hnxsxcbv7dkzerq4chssotexb276pidzwclbytzj7m4t47u';

const FLAGGED_PROPOSALS: Record<string, FlaggedProposal> = {
  '40206354484003228084362487350961959469393498496889094972132496370956127262976': {
    proposalId: '40206354484003228084362487350961959469393498496889094972132496370956127262976',
    summary:
      'Transfers ownership of the Olas Treasury to an externally owned account. The Treasury owner controls the protocol-owned liquidity, the ETH held for services, and — through the dispenser — the OLAS mint.',
    actions: [
      'Treasury.changeOwner(0x7b8ec82237fb0c7926c72fbbe60609b21d17561d) — an externally owned account, not a Safe',
    ],
  },
  '65184818244999358579284341127159336724025980098339608095975141185414377614750': {
    proposalId: '65184818244999358579284341127159336724025980098339608095975141185414377614750',
    summary:
      'Transfers ownership of the Olas Treasury and the OLAS minter role to an externally owned account, which would allow unlimited minting up to the remaining inflation cap.',
    actions: [
      'Treasury.changeOwner(0x56f016a4dbbe26fe403e27d0ce1dba56915dcef5) — the proposer itself',
      'OLAS.changeMinter(0x56f016a4dbbe26fe403e27d0ce1dba56915dcef5) — hands over the mint',
    ],
  },
};

export const getFlaggedProposal = (proposalId: string | undefined | null) =>
  proposalId ? (FLAGGED_PROPOSALS[proposalId] ?? null) : null;

export const isFlaggedProposal = (proposalId: string | undefined | null) =>
  getFlaggedProposal(proposalId) !== null;
