import type { NextApiRequest, NextApiResponse } from 'next';

import { setCorsHeaders } from '../../../utils/cors';

/**
 * Supported agents that may become geo-restricted.
 * Keep these IDs same as in pearl to reference
 */
type AgentId = 'polymarket_trader';

type EligibilityStatus = 'allowed' | 'restricted' | 'unknown';

type ReasonCode = 'RESTRICTED_COUNTRY' | 'RESTRICTED_REGION' | 'GEO_UNAVAILABLE' | 'AGENT_UNKNOWN';

type AgentEligibility = {
  status: EligibilityStatus;
  reason_code?: ReasonCode;
};

type EligibilityResponse = {
  checked_at: number;
  eligibility: Record<AgentId, AgentEligibility>;
};

/**
 * Policy config
 * ISO-3166-1 alpha-2 country codes. UK is "GB".
 * ISO-3166-2 region codes are formatted as COUNTRY-SUBDIVISION (e.g., CA-ON).
 *
 * This list reflects the current compliance-approved geo restrictions for each agent.
 * Update only in accordance with the latest compliance policy and review process.
 */
type AgentPolicy = {
  restrictedCountries: Set<string>;
  restrictedRegions: Set<string>;
};

const AGENT_POLICIES: Record<AgentId, AgentPolicy> = {
  polymarket_trader: {
    restrictedCountries: new Set([
      'AF', // Afghanistan
      'AU', // Australia
      'BE', // Belgium
      'BI', // Burundi
      'BY', // Belarus
      'CD', // Democratic Republic of Congo
      'CF', // Central African Republic
      'CU', // Cuba
      'DE', // Germany
      'ER', // Eritrea
      'ET', // Ethiopia
      'FR', // France
      'GB', // United Kingdom
      'GW', // Guinea-Bissau
      'IR', // Iran
      'IQ', // Iraq
      'IT', // Italy
      'KP', // North Korea
      'LB', // Lebanon
      'LY', // Libya
      'ML', // Mali
      'MM', // Myanmar
      'NI', // Nicaragua
      'PL', // Poland
      'RU', // Russia
      'SD', // Sudan
      'SG', // Singapore
      'SO', // Somalia
      'SS', // South Sudan
      'SY', // Syria
      'TH', // Thailand
      'TW', // Taiwan
      'UM', // United States Minor Outlying Islands
      'US', // United States
      'VE', // Venezuela
      'YE', // Yemen
      'ZW', // Zimbabwe
    ]),
    restrictedRegions: new Set([
      'CA-ON', // Ontario
      'MD-SN', // Transnistria (Stînga Nistrului)
      'UA-43', // Crimea
      'UA-14', // Donetsk
      'UA-09', // Luhansk
    ]),
  },
} as const;

function getVercelCountry(req: NextApiRequest): string | undefined {
  const raw = req.headers['x-vercel-ip-country'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  return value.toUpperCase();
}

const ISO_3166_REGION_PATTERN = /^[A-Z]{2}-[A-Z0-9]{1,3}$/;
function getVercelCountryRegion(req: NextApiRequest, country?: string): string | undefined {
  const raw = req.headers['x-vercel-ip-country-region'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;

  const normalized = value.toUpperCase();

  if (normalized.includes('-')) {
    if (!ISO_3166_REGION_PATTERN.test(normalized)) return undefined;
    if (country && normalized.split('-')[0] !== country) return undefined;
    return normalized;
  }

  if (!country) return undefined;

  const withCountry = `${country}-${normalized}`;
  if (!ISO_3166_REGION_PATTERN.test(withCountry)) return undefined;
  return withCountry;
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
  return id in AGENT_POLICIES;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EligibilityResponse | { error: string }>,
) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const checkedAt = Date.now();
  const country = getVercelCountry(req);
  const region = getVercelCountryRegion(req, country);

  const requestedAgents = parseAgentsQuery(req);
  const agentIds = requestedAgents?.length
    ? requestedAgents
    : (Object.keys(AGENT_POLICIES) as AgentId[]);

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

    const policy = AGENT_POLICIES[agentId];

    if (policy.restrictedCountries.has(country)) {
      eligibility[agentId] = {
        status: 'restricted',
        reason_code: 'RESTRICTED_COUNTRY',
      };
      continue;
    }

    if (region) {
      if (policy.restrictedRegions.has(region)) {
        eligibility[agentId] = {
          status: 'restricted',
          reason_code: 'RESTRICTED_REGION',
        };
        continue;
      }
    }

    eligibility[agentId] = { status: 'allowed' };
  }

  // Do not cache geo-based eligibility responses to avoid stale geo-location data
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const response: EligibilityResponse = {
    checked_at: checkedAt,
    eligibility,
  };

  return res.status(200).json(response);
}
