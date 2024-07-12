import { rewardsFormatter } from './utils';

describe('rewardsFormatter', () => {
  it('should format rewards with default decimal places', () => {
    expect(rewardsFormatter(BigInt('10000000000000000000000'))).toBe('10,000.0000');
    expect(rewardsFormatter(BigInt('1000000000000000000'))).toBe('1.0000');
    expect(rewardsFormatter(BigInt('500000000000000000'))).toBe('0.5000');
    expect(rewardsFormatter(BigInt('123456789000000000'))).toBe('0.1235');
    expect(rewardsFormatter(BigInt('5555555'))).toBe('0.0000');
  });

  it('should format rewards with custom decimal places', () => {
    expect(rewardsFormatter(BigInt('1000000000000000000'), 0)).toBe('1');
    expect(rewardsFormatter(BigInt('1000000000000000000'), 2)).toBe('1.00');
    expect(rewardsFormatter(BigInt('500000000000000000'), 3)).toBe('0.500');
    expect(rewardsFormatter(BigInt('123456789000000000'), 6)).toBe('0.123457');
  });

  it('should format rewards with negative value and zero values', () => {
    expect(rewardsFormatter(BigInt('-1000000000000000000'))).toBe('-1.0000');
    expect(rewardsFormatter(BigInt('-500000000000000000'), 2)).toBe('-0.50');
    expect(rewardsFormatter(BigInt(0), 4)).toBe('0.0000');
  });
});
