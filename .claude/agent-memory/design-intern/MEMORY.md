# UI Design Advisor Memory

## Marketplace App - Key Patterns
- App path: `apps/marketplace/`
- AI Agents list page: `pages/[network]/ai-agents/index.jsx` renders `ListServices` component
- AI Agent detail page: `pages/[network]/ai-agents/[id].jsx` renders `Details` -> `DetailsSubInfo`
- Detail sections use `EachSection` + `SubTitle` (bold) + `Info` div pattern in `DetailsSubInfo`
- External links use `UNICODE_SYMBOLS.EXTERNAL_LINK` (arrow symbol) from `libs/util-constants/src/lib/symbols.ts`
- Link styling: Next.js `Link` with `target="_blank"` or antd `Button type="link"` or plain `<a>` tags

## ERC-8004 Implementation
- API endpoint: `pages/api/erc8004/[network]/ai-agents/[serviceId].ts`
- Rewrites in `next.config.js`: `/erc8004/:network/ai-agents/:serviceId` -> `/api/erc8004/...`
- Public URL pattern: `https://marketplace.olas.network/erc8004/{network}/ai-agents/{serviceId}`
- Supported chains: `ERC8004_SUPPORTED_CHAINS = [1, 10, 100, 137, 8453, 42161, 42220]` in `common-util/graphql/index.ts`
- Network names from `kebabCase(chain.name)` in `common-util/Login/config.tsx`
- Response type includes: name, description, image, services[], x402Support, active, registrations[]

## Theme & Styling
- Colors in `libs/ui-theme/src/lib/ui-theme.tsx` - see COLOR, BREAK_POINT, MEDIA_QUERY exports
- Primary: #7e22ce, Text primary: #1F2229, Text secondary/tertiary: #606F85
- styled-components used extensively - Section styles in `common-util/Details/styles.tsx`
- `SectionContainer > EachSection > SubTitle + Info` is the standard detail layout pattern
- `ViewHashAndCode` component shows external links inline with dot separators: `&nbsp;•&nbsp;`

## List Table Patterns
- AI Agents table columns: ID, Description, Services Offered, Marketplace Role, Marketplace Activity
- "Services Offered" opens a modal (`ServicesOfferedModal`) showing IPFS metadata
- Modal uses `Flex vertical gap={24}` layout with `SectionHeading` + content pattern
