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
  eligibility: Record<AgentId, AgentEligibility>;
};

// TODO: to be confirmed from compliance team!
/**
 * Policy config
 * ISO-3166-1 alpha-2 country codes. UK is "GB".
 *
 * This list reflects the current compliance-approved geo restrictions for each agent.
 * Update only in accordance with the latest compliance policy and review process.
 */
const RESTRICTED_COUNTRIES_BY_AGENT: Record<AgentId, Set<string>> = {
  polymarket_trader: new Set(['CU', 'KP', 'SY', 'IR', 'RU', 'UA']),
};

function getVercelCountry(req: NextApiRequest): string | undefined {
  const raw = req.headers['x-vercel-ip-country'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  return value.toUpperCase();
}

/**
 * Supports parsing ?agents=a,b,c or ?agents=a&agents=b
 */
function parseAgentsQuery(req: NextApiRequest): string[] | null {
  const agents = req.query.agents;
  if (!agents) return null;

  // ?agents=a&agents=b OR ?agents=a,b,c
  const values = Array.isArray(agents) ? agents : [agents];

  return values
    .flatMap((value) => value.split(','))
    .map((string) => string.trim())
    .filter(Boolean);
}

function isKnownAgentId(id: string): id is AgentId {
  return id in RESTRICTED_COUNTRIES_BY_AGENT;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<EligibilityResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      checked_at: Date.now(),
      eligibility: {
        polymarket_trader: { status: 'unknown', reason_code: undefined },
      },
    });
  }

  const checkedAt = Date.now();
  const country = getVercelCountry(req);

  const requestedAgents = parseAgentsQuery(req);
  const agentIds = requestedAgents?.length
    ? requestedAgents
    : (Object.keys(RESTRICTED_COUNTRIES_BY_AGENT) as AgentId[]);

  const eligibility: Record<string, AgentEligibility> = {};

  for (const agentId of agentIds) {
    // Unknown agent requested
    if (!isKnownAgentId(agentId)) {
      eligibility[agentId] = { status: 'unknown', reason_code: 'AGENT_UNKNOWN' };
      const response: EligibilityResponse = {
        checked_at: checkedAt,
        eligibility,
      };
      return res.status(400).json(response);
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

  // Do not cache geo-based eligibility responses to avoid stale geo-location data
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const response: EligibilityResponse = {
    checked_at: checkedAt,
    eligibility,
  };

  return res.status(200).json(response);
}
