// USDC has 6 decimals; dynamic mech pricing charges fractions of a cent
// (e.g. 11800 micro-USDC = $0.0118), so 2-decimal rounding hides the real
// charge. Amounts are shown with 2 to 6 decimals, trailing zeros trimmed,
// and computed with bigint so large or tiny values don't lose precision.
const USDC_DECIMALS = 6;
const MIN_DECIMALS = 2;
const SCALE = 10n ** BigInt(USDC_DECIMALS);

const formatScaled = (scaled: bigint): string => {
  const negative = scaled < 0n;
  const abs = negative ? -scaled : scaled;
  const whole = abs / SCALE;
  const fraction = (abs % SCALE).toString().padStart(USDC_DECIMALS, '0');
  let trimmed = fraction.replace(/0+$/, '');
  if (trimmed.length < MIN_DECIMALS) trimmed = trimmed.padEnd(MIN_DECIMALS, '0');
  return `${negative ? '-' : ''}${whole}.${trimmed}`;
};

/** Raw micro-USDC (integer string or bigint) → USD string, e.g. `11800` → `0.0118`. */
export const formatMicroUsdc = (raw: string | bigint): string | null => {
  if (typeof raw === 'bigint') return formatScaled(raw);
  if (!/^-?\d+$/.test(raw.trim())) return null;
  return formatScaled(BigInt(raw.trim()));
};

/**
 * Decimal USD string (e.g. a subgraph BigDecimal) → USD string with 2–6
 * decimals, rounded half-up at the 6th decimal. `0.0118` → `0.0118`,
 * `1` → `1.00`. Returns null when the input isn't a plain decimal.
 */
export const formatUsdAmount = (value: string): string | null => {
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(value.trim());
  if (!match || (!match[2] && !match[3])) return null;
  const [, sign, whole = '', fraction = ''] = match;
  const kept = fraction.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, '0');
  let scaled = BigInt(`${whole || '0'}${kept}`);
  if ((fraction[USDC_DECIMALS] ?? '0') >= '5') scaled += 1n;
  return formatScaled(sign && scaled !== 0n ? -scaled : scaled);
};
