import type { Address } from 'viem';

import type { ClaimBatch } from 'common-util/functions/staking-incentives-claim';

import {
  clearState,
  governReducer,
  setOwnClaimedThrough,
  setPendingClaim,
  setStakingContracts,
} from './govern';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const OTHER: Address = '0x00000000000000000000000000000000000000bb';
const BATCH: ClaimBatch = [[100], [['0x01']]];

const write = (
  state: ReturnType<typeof governReducer> | undefined,
  account: Address,
  run: number,
  pending: Parameters<typeof setPendingClaim>[0]['pending'],
) => governReducer(state, setPendingClaim({ account, run, pending }));

describe('govern slice', () => {
  it('keeps the pending and own claims through clearState, and resets everything else', () => {
    const initial = governReducer(undefined, { type: 'init' });
    let state = governReducer(initial, setStakingContracts([]));
    state = write(state, ACCOUNT, 1, { status: 'waiting', hash: '0xhash', batch: BATCH });

    state = governReducer(state, setOwnClaimedThrough({ [ACCOUNT]: 10 }));
    const cleared = governReducer(state, clearState());

    expect(cleared.ownClaimedThrough).toEqual({ [ACCOUNT]: 10 });

    expect(cleared.pendingClaims[ACCOUNT]).toEqual([
      { status: 'waiting', hash: '0xhash', batch: BATCH, run: 1 },
    ]);
    expect({ ...cleared, pendingClaims: {}, ownClaimedThrough: {} }).toEqual(initial);
  });

  it('forgets an account whose last pending claim is cleared', () => {
    let state = write(undefined, ACCOUNT, 1, { status: 'sending' });
    state = write(state, ACCOUNT, 1, null);

    expect(state.pendingClaims).toEqual({});
  });

  it('sets and clears one account without touching another', () => {
    let state = write(undefined, OTHER, 2, {
      status: 'waiting',
      hash: '0xother',
      batch: BATCH,
    });
    state = write(state, ACCOUNT, 1, { status: 'preparing' });
    expect(state.pendingClaims).toEqual({
      [OTHER]: [{ status: 'waiting', hash: '0xother', batch: BATCH, run: 2 }],
      [ACCOUNT]: [{ status: 'preparing', run: 1 }],
    });

    state = write(state, ACCOUNT, 1, null);

    expect(state.pendingClaims).toEqual({
      [OTHER]: [{ status: 'waiting', hash: '0xother', batch: BATCH, run: 2 }],
    });
  });

  it("updates or clears only the run's own entry, never a newer claim's", () => {
    let state = write(undefined, ACCOUNT, 2, {
      status: 'waiting',
      hash: '0xnew',
      batch: BATCH,
    });

    // A dismissed claim signed anyway is guarded next to the newer one.
    state = write(state, ACCOUNT, 1, { status: 'waiting', hash: '0xold', batch: BATCH });
    expect(state.pendingClaims[ACCOUNT]).toEqual([
      { status: 'waiting', hash: '0xnew', batch: BATCH, run: 2 },
      { status: 'waiting', hash: '0xold', batch: BATCH, run: 1 },
    ]);

    state = write(state, ACCOUNT, 1, { status: 'unconfirmed', hash: '0xold', batch: BATCH });
    state = write(state, ACCOUNT, 2, null);
    expect(state.pendingClaims[ACCOUNT]).toEqual([
      { status: 'unconfirmed', hash: '0xold', batch: BATCH, run: 1 },
    ]);
  });

  it('ignores a clear from a run that holds no entry', () => {
    let state = write(undefined, ACCOUNT, 2, { status: 'preparing' });
    state = write(state, ACCOUNT, 1, null);

    expect(state.pendingClaims[ACCOUNT]).toEqual([{ status: 'preparing', run: 2 }]);
  });
});
