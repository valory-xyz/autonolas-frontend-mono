import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Supported agents that may become geo-restricted.
 * Keep these IDs same as in pearl to reference
 */
type AgentId = 'polymarket_trader';

type EligibilityStatus = 'allowed' | 'restricted' | 'unknown';

type ReasonCode = 'RESTRICTED_COUNTRY' | 'GEO_UNAVAILABLE' | 'AGENT_UNKNOWN';

type AgentEligibility = {
  status: EligibilityStatus;
  reason_code?: ReasonCode;
};

type EligibilityResponse = {
  checked_at: number;
  geo?: {
    country?: string; // optional; can be omitted via env toggle
    source: 'vercel' | 'unknown';
  };
  eligibility: Record<AgentId, AgentEligibility>;
};

/**
 * Policy config
 * ISO-3166-1 alpha-2 country codes. UK is "GB".
 */
const RESTRICTED_COUNTRIES_BY_AGENT: Record<AgentId, Set<string>> = {
  polymarket_trader: new Set([
    'US',
    // TODO: Add OFAC / other restricted codes here
  ]),
};

// Toggle whether we expose the derived country to the client.
// Good for debugging; legal may want this off.
const EXPOSE_COUNTRY = (process.env.GEO_EXPOSE_COUNTRY ?? 'false') === 'true';

// Header commonly set by Vercel for country; may be missing in local dev.
function getVercelCountry(req: NextApiRequest): string | undefined {
  const raw = req.headers['x-vercel-ip-country'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  return value.toUpperCase();
}

function parseAgentsQuery(req: NextApiRequest): string[] | null {
  // supports: ?agents=a,b,c or ?agents=a&agents=b
  const q = req.query.agents;
  if (!q) return null;

  if (Array.isArray(q)) {
    // ?agents=a&agents=b
    return q
      .flatMap((v) => v.split(','))
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // ?agents=a,b,c
  return q
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isKnownAgentId(id: string): id is AgentId {
  return Object.prototype.hasOwnProperty.call(RESTRICTED_COUNTRIES_BY_AGENT, id);
}

export default function handler(req: NextApiRequest, res: NextApiResponse<EligibilityResponse>) {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      checked_at: Date.now(),
      geo: { source: 'unknown' },
      eligibility: {
        polymarket_trader: { status: 'unknown', reason_code: undefined },
      },
    });
  }

  const checkedAt = Date.now();

  const country = getVercelCountry(req);
  const geoSource: 'vercel' | 'unknown' = country ? 'vercel' : 'unknown';

  const requestedAgents = parseAgentsQuery(req);
  const agentIds = requestedAgents?.length
    ? requestedAgents
    : (Object.keys(RESTRICTED_COUNTRIES_BY_AGENT) as AgentId[]);

  const eligibility: Record<string, AgentEligibility> = {};

  for (const agentId of agentIds) {
    // Unknown agent requested
    if (!isKnownAgentId(agentId)) {
      eligibility[agentId] = { status: 'unknown', reason_code: 'AGENT_UNKNOWN' };
      continue;
    }

    // Can't infer geo (local dev, headers stripped, etc.)
    if (!country) {
      eligibility[agentId] = { status: 'unknown', reason_code: 'GEO_UNAVAILABLE' };
      continue;
    }

    const restrictedSet = RESTRICTED_COUNTRIES_BY_AGENT[agentId];
    const isRestricted = restrictedSet.has(country);

    eligibility[agentId] = isRestricted
      ? { status: 'restricted', reason_code: 'RESTRICTED_COUNTRY' }
      : { status: 'allowed' };
  }

  // Cache headers: You can keep these conservative.
  // This does NOT prevent your app from force-refreshing whenever needed.
  // Adjust as you wish; or remove entirely.
  res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes

  const response: EligibilityResponse = {
    checked_at: checkedAt,
    geo: {
      source: geoSource,
      ...(EXPOSE_COUNTRY ? { country } : {}),
    },
    eligibility,
  };

  return res.status(200).json(response);
}
