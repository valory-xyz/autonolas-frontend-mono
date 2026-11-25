import type { Activity } from 'common-util/graphql/service-activity';
import { LEGACY_DELIVERY_PAYMENT_WEI } from 'common-util/graphql/service-activity';
import { formatPayment } from 'common-util/Details/ActivityDetails';

const activity = (overrides: Partial<Activity> = {}): Activity => ({
  activityType: 'Supply',
  requestId: '0x1',
  requestIpfsHash: undefined,
  requestBlockTimestamp: '1',
  requestedBy: '0x' + '11'.repeat(20),
  requestTransactionHash: '0x',
  deliveryIpfsHash: undefined,
  deliveredBy: '0x' + '22'.repeat(20),
  deliveryTransactionHash: '0x',
  deliveryBlockTimestamp: '2',
  ...overrides,
});

describe('formatPayment', () => {
  it.each([
    ['0.0118', '$0.0118'],
    ['0.01', '$0.01'],
    ['0.0095', '$0.0095'],
    ['1.234567', '$1.234567'],
    ['2', '$2.00'],
  ])('USDC finalFeeUSD %s → %s (2–6 decimals, not rounded to cents)', (usd, expected) => {
    expect(formatPayment(activity({ feeUnit: 'USDC', feeRaw: '0', finalFeeUSD: usd }))).toBe(
      expected,
    );
  });

  it('USDC with no finalFeeUSD shows nothing', () => {
    expect(formatPayment(activity({ feeUnit: 'USDC', finalFeeUSD: null }))).toBeNull();
  });

  it('legacy AgentMech row (no feeUnit) still shows 0.01 xDAI on Gnosis', () => {
    expect(formatPayment(activity({ payment: LEGACY_DELIVERY_PAYMENT_WEI }), 100)).toBe(
      '0.01 XDAI',
    );
  });
});
