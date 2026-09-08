#!/usr/bin/env node
/**
 * Reports how far behind each configured RPC endpoint is.
 *
 * A stale node does not error — it answers `eth_getBlockByNumber('latest')` with an old block.
 * Anything derived from "now" is then silently wrong while looking entirely plausible: the
 * operate staking table renders a countdown as `livenessPeriod - (latestBlock - tsCheckpoint)`,
 * so a node 100 days behind produces a confident, wrong "4H 22M to go".
 *
 *   node scripts/check-rpc-freshness.mjs                 # every chain in the current env
 *   node scripts/check-rpc-freshness.mjs <url> [<url>…]  # specific endpoints
 *
 * Reads NEXT_PUBLIC_*_URL from the environment. To check production, pull the deployed values
 * first (`vercel env pull .env.production --environment=production`) and run with those loaded.
 * Exits non-zero if any endpoint is stale, so it can be wired into monitoring.
 */

/** Every chain still produces blocks in seconds, so minutes of lag is already a problem. */
const STALE_AFTER_SECONDS = 300;

const CHAINS = [
  ['Mainnet', 'NEXT_PUBLIC_MAINNET_URL'],
  ['Optimism', 'NEXT_PUBLIC_OPTIMISM_URL'],
  ['Gnosis', 'NEXT_PUBLIC_GNOSIS_URL'],
  ['Polygon', 'NEXT_PUBLIC_POLYGON_URL'],
  ['Base', 'NEXT_PUBLIC_BASE_URL'],
  ['Mode', 'NEXT_PUBLIC_MODE_URL'],
  ['Arbitrum', 'NEXT_PUBLIC_ARBITRUM_URL'],
  ['Celo', 'NEXT_PUBLIC_CELO_URL'],
];

/** These URLs can carry an API key in the path or query — never print them whole. */
const maskUrl = (url) => {
  try {
    const { protocol, host, pathname } = new URL(url);
    const firstSegment = pathname.split('/').filter(Boolean)[0];
    return `${protocol}//${host}${firstSegment ? `/${firstSegment}/…` : ''}`;
  } catch {
    return '<unparseable url>';
  }
};

const latestBlock = async (url) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBlockByNumber',
      params: ['latest', false],
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(body.error.message ?? 'RPC error');
  if (!body.result) throw new Error('no result');
  return {
    number: Number(BigInt(body.result.number)),
    timestamp: Number(BigInt(body.result.timestamp)),
  };
};

const args = process.argv.slice(2);
const targets = args.length
  ? args.map((url, i) => [`arg${i + 1}`, url])
  : CHAINS.map(([name, key]) => [name, process.env[key]]).filter(([, url]) => Boolean(url));

if (targets.length === 0) {
  console.error(
    'No RPC URLs found. Pass URLs as arguments, or load an env file with NEXT_PUBLIC_*_URL set\n' +
      '(e.g. `node --env-file=.env.local scripts/check-rpc-freshness.mjs`).',
  );
  process.exit(2);
}

let stale = 0;
let failed = 0;

for (const [name, url] of targets) {
  try {
    const { number, timestamp } = await latestBlock(url);
    const lagSeconds = Math.round(Date.now() / 1000) - timestamp;
    const isStale = lagSeconds > STALE_AFTER_SECONDS;
    if (isStale) stale += 1;

    const lag =
      lagSeconds > 86400
        ? `${(lagSeconds / 86400).toFixed(1)} days behind`
        : `${lagSeconds}s behind`;

    console.log(
      `${isStale ? '✗' : '✓'} ${name.padEnd(10)} block ${String(number).padEnd(12)} ` +
        `${new Date(timestamp * 1000).toISOString()}  ${lag}   ${maskUrl(url)}`,
    );
  } catch (error) {
    failed += 1;
    console.error(`! ${name.padEnd(10)} unreachable: ${error.message}   ${maskUrl(url)}`);
  }
}

if (stale > 0) {
  console.error(
    `\n${stale} endpoint(s) more than ${STALE_AFTER_SECONDS}s behind. Anything computed from ` +
      `"latest block" on these chains is wrong — see the countdown note in apps/operate/CLAUDE.md.`,
  );
}
process.exit(stale > 0 || failed > 0 ? 1 : 0);
