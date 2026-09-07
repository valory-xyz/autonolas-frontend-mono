import { getFlaggedProposal, isFlaggedProposal } from './flaggedProposals';

const HOSTILE_TREASURY_OWNER =
  '40206354484003228084362487350961959469393498496889094972132496370956127262976';
const HOSTILE_TREASURY_AND_MINTER =
  '65184818244999358579284341127159336724025980098339608095975141185414377614750';

describe('flaggedProposals', () => {
  it('flags the two proposals that hand over protocol assets', () => {
    expect(isFlaggedProposal(HOSTILE_TREASURY_OWNER)).toBe(true);
    expect(isFlaggedProposal(HOSTILE_TREASURY_AND_MINTER)).toBe(true);
  });

  it('does not flag anything else', () => {
    // The DAO's own proposal 15, raising proposalThreshold and the quorum numerator.
    expect(
      isFlaggedProposal(
        '3563000702947626407249966116394330391891319244018918786718598572660765109424',
      ),
    ).toBe(false);
    expect(isFlaggedProposal(undefined)).toBe(false);
    expect(isFlaggedProposal(null)).toBe(false);
    expect(isFlaggedProposal('')).toBe(false);
  });

  it('describes every action in the flagged calldata', () => {
    expect(getFlaggedProposal(HOSTILE_TREASURY_OWNER)?.actions).toHaveLength(1);
    expect(getFlaggedProposal(HOSTILE_TREASURY_AND_MINTER)?.actions).toHaveLength(2);
    expect(getFlaggedProposal(HOSTILE_TREASURY_AND_MINTER)?.actions[1]).toContain('changeMinter');
  });
});
