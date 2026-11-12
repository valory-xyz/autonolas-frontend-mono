import type { Address } from 'viem';

import type { Cursors } from 'common-util/functions/claim-batches';

import {
  clearState,
  governReducer,
  pruneOwnClaims,
  recordOwnClaims,
  setPendingClaim,
  setStakingContracts,
} from './govern';

const ACCOUNT: Address = '0x00000000000000000000000000000000000000aa';
const OTHER: Address = '0x00000000000000000000000000000000000000bb';
const STAKING_CONTRACT: Address = '0x00000000000000000000000000000000000000cc';
const OTHER_CONTRACT: Address = '0x00000000000000000000000000000000000000dd';
const UNREAD_CONTRACT: Address = '0x00000000000000000000000000000000000000ee';
const THROUGH: Cursors = { [STAKING_CONTRACT]: 10 };

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
    state = write(state, ACCOUNT, 1, {
      status: 'waiting',
      hash: '0xhash',
      claimedThrough: THROUGH,
    });

    state = governReducer(state, recordOwnClaims(THROUGH));
    const cleared = governReducer(state, clearState());

    expect(cleared.ownClaimedThrough).toEqual(THROUGH);
    expect(cleared.pendingClaims[ACCOUNT]).toEqual([
      { status: 'waiting', hash: '0xhash', claimedThrough: THROUGH, run: 1 },
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
      claimedThrough: THROUGH,
    });
    state = write(state, ACCOUNT, 1, { status: 'preparing' });
    expect(state.pendingClaims).toEqual({
      [OTHER]: [{ status: 'waiting', hash: '0xother', claimedThrough: THROUGH, run: 2 }],
      [ACCOUNT]: [{ status: 'preparing', run: 1 }],
    });

    state = write(state, ACCOUNT, 1, null);

    expect(state.pendingClaims).toEqual({
      [OTHER]: [{ status: 'waiting', hash: '0xother', claimedThrough: THROUGH, run: 2 }],
    });
  });

  it("updates or clears only the run's own entry, never a newer claim's", () => {
    let state = write(undefined, ACCOUNT, 2, {
      status: 'waiting',
      hash: '0xnew',
      claimedThrough: THROUGH,
    });

    // A dismissed claim signed anyway is guarded next to the newer one.
    state = write(state, ACCOUNT, 1, { status: 'waiting', hash: '0xold', claimedThrough: THROUGH });
    expect(state.pendingClaims[ACCOUNT]).toEqual([
      { status: 'waiting', hash: '0xnew', claimedThrough: THROUGH, run: 2 },
      { status: 'waiting', hash: '0xold', claimedThrough: THROUGH, run: 1 },
    ]);

    state = write(state, ACCOUNT, 1, {
      status: 'unconfirmed',
      hash: '0xold',
      claimedThrough: THROUGH,
    });
    state = write(state, ACCOUNT, 2, null);
    expect(state.pendingClaims[ACCOUNT]).toEqual([
      { status: 'unconfirmed', hash: '0xold', claimedThrough: THROUGH, run: 1 },
    ]);
  });

  it('ignores a clear from a run that holds no entry', () => {
    let state = write(undefined, ACCOUNT, 2, { status: 'preparing' });
    state = write(state, ACCOUNT, 1, null);

    expect(state.pendingClaims[ACCOUNT]).toEqual([{ status: 'preparing', run: 2 }]);
  });

  it('records own claims by the furthest cursor, so recording one twice changes nothing', () => {
    let state = governReducer(undefined, recordOwnClaims({ [STAKING_CONTRACT]: 10 }));
    state = governReducer(state, recordOwnClaims({ [STAKING_CONTRACT]: 9, [OTHER_CONTRACT]: 4 }));

    expect(state.ownClaimedThrough).toEqual({ [STAKING_CONTRACT]: 10, [OTHER_CONTRACT]: 4 });
    expect(governReducer(state, recordOwnClaims({ [STAKING_CONTRACT]: 10 }))).toEqual(state);
  });

  it('drops the own claims a read reached or did not read, and keeps those it lags', () => {
    let state = governReducer(
      undefined,
      recordOwnClaims({ [STAKING_CONTRACT]: 10, [OTHER_CONTRACT]: 4, [UNREAD_CONTRACT]: 7 }),
    );
    state = governReducer(state, pruneOwnClaims({ [STAKING_CONTRACT]: 9, [OTHER_CONTRACT]: 4 }));

    expect(state.ownClaimedThrough).toEqual({ [STAKING_CONTRACT]: 10 });
  });
});
