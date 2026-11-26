import { formatMicroUsdc, formatUsdAmount } from 'common-util/functions/usdAmount';

describe('formatMicroUsdc', () => {
  it.each([
    ['11800', '0.0118'],
    ['10000', '0.01'],
    ['9500', '0.0095'],
    ['20000', '0.02'],
    ['1', '0.000001'],
    ['0', '0.00'],
    ['1000000', '1.00'],
    ['1234567', '1.234567'],
    // Far beyond Number's safe range; bigint keeps every digit.
    ['60000000000000000', '60000000000.00'],
    ['123456789012345678901', '123456789012345.678901'],
  ])('%s micro-USDC → %s', (raw, expected) => {
    expect(formatMicroUsdc(raw)).toBe(expected);
  });

  it('accepts a bigint', () => {
    expect(formatMicroUsdc(11800n)).toBe('0.0118');
  });

  it.each(['', 'abc', '1.5', '1e6'])('returns null for non-integer input %p', (raw) => {
    expect(formatMicroUsdc(raw)).toBeNull();
  });
});

describe('formatUsdAmount', () => {
  it.each([
    ['0.0118', '0.0118'],
    ['0.01', '0.01'],
    ['0.0095', '0.0095'],
    ['1', '1.00'],
    ['1.5', '1.50'],
    ['12.34', '12.34'],
    ['.5', '0.50'],
    // Rounded half-up at the 6th decimal.
    ['0.0000005', '0.000001'],
    ['0.0000004', '0.00'],
    ['0.0117999999', '0.0118'],
    ['-0.0095', '-0.0095'],
  ])('%s → %s', (value, expected) => {
    expect(formatUsdAmount(value)).toBe(expected);
  });

  it.each(['', '.', 'abc', '1e-2', '$1'])('returns null for non-decimal input %p', (value) => {
    expect(formatUsdAmount(value)).toBeNull();
  });
});
